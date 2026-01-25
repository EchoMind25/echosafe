// supabase/functions/bulk-dnc-upload/index.ts
// Edge Function for processing bulk DNC registry uploads with FTC compliance tracking

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://deno.land/std@0.168.0/encoding/csv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingResult {
  areaCode: string
  recordsProcessed: number
  recordsAdded: number
  recordsUpdated: number
  recordsFailed: number
  errors: string[]
  durationMs: number
}

interface UploadRequest {
  admin_upload_id: string
  ftc_release_date?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { admin_upload_id, ftc_release_date } = await req.json() as UploadRequest

    if (!admin_upload_id) {
      throw new Error('admin_upload_id is required')
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get upload details
    const { data: upload, error: uploadError } = await supabase
      .from('admin_uploads')
      .select('*')
      .eq('id', admin_upload_id)
      .single()

    if (uploadError || !upload) {
      throw new Error(`Upload not found: ${uploadError?.message || 'Unknown error'}`)
    }

    // Update processing started
    await supabase
      .from('admin_uploads')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        ftc_release_date: ftc_release_date || null,
      })
      .eq('id', admin_upload_id)

    const results: ProcessingResult[] = []
    let totalProcessed = 0
    let filesProcessed = 0

    // Process each area code file
    for (const areaCode of upload.area_codes) {
      const startTime = Date.now()
      const errors: string[] = []

      // Validate FTC subscription for this area code
      const { data: subscription, error: subError } = await supabase
        .from('ftc_subscriptions')
        .select('*')
        .eq('area_code', areaCode)
        .eq('subscription_status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (subError || !subscription) {
        const errorMsg = `No valid FTC subscription for area code ${areaCode}`
        errors.push(errorMsg)

        // Log the error but continue with other area codes
        await supabase.from('dnc_update_log').insert({
          admin_upload_id,
          area_code: areaCode,
          ftc_release_date: ftc_release_date || null,
          status: 'failed',
          error_message: errorMsg,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })

        results.push({
          areaCode,
          recordsProcessed: 0,
          recordsAdded: 0,
          recordsUpdated: 0,
          recordsFailed: 0,
          errors,
          durationMs: Date.now() - startTime,
        })

        continue
      }

      // Create update log entry
      const { data: logEntry, error: logError } = await supabase
        .from('dnc_update_log')
        .insert({
          admin_upload_id,
          area_code: areaCode,
          ftc_release_date: ftc_release_date || null,
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (logError) {
        console.error(`Failed to create log entry for ${areaCode}:`, logError)
      }

      try {
        // Download CSV file from storage
        const filePath = `admin-uploads/${admin_upload_id}/ftc_${areaCode}_data.csv`
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from('admin-uploads')
          .download(filePath)

        if (downloadError) {
          // Try alternate naming pattern
          const altPath = `admin-uploads/${admin_upload_id}/${areaCode}.csv`
          const { data: altFileData, error: altDownloadError } = await supabase
            .storage
            .from('admin-uploads')
            .download(altPath)

          if (altDownloadError) {
            throw new Error(`File not found: ${filePath} or ${altPath}`)
          }

          // Process alternate file
          await processFile(
            supabase,
            altFileData,
            areaCode,
            admin_upload_id,
            logEntry?.id,
            results,
            ftc_release_date
          )
        } else {
          // Process main file
          await processFile(
            supabase,
            fileData,
            areaCode,
            admin_upload_id,
            logEntry?.id,
            results,
            ftc_release_date
          )
        }

        filesProcessed++
        totalProcessed += results[results.length - 1]?.recordsProcessed || 0

        // Update FTC subscription last_update_at
        await supabase
          .from('ftc_subscriptions')
          .update({
            last_update_at: new Date().toISOString(),
            last_record_count: results[results.length - 1]?.recordsProcessed || 0,
            total_records: subscription.total_records + (results[results.length - 1]?.recordsAdded || 0),
          })
          .eq('id', subscription.id)

      } catch (areaError) {
        const errorMsg = areaError instanceof Error ? areaError.message : 'Unknown error'
        errors.push(errorMsg)

        // Update log entry with error
        if (logEntry?.id) {
          await supabase
            .from('dnc_update_log')
            .update({
              status: 'failed',
              error_message: errorMsg,
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            })
            .eq('id', logEntry.id)
        }

        results.push({
          areaCode,
          recordsProcessed: 0,
          recordsAdded: 0,
          recordsUpdated: 0,
          recordsFailed: 0,
          errors,
          durationMs: Date.now() - startTime,
        })
      }

      // Update progress
      const progress = {
        ...upload.progress,
        [areaCode]: results.find(r => r.areaCode === areaCode)
          ? 100
          : (results.filter(r => r.areaCode === areaCode).length / upload.area_codes.length) * 100,
      }

      await supabase
        .from('admin_uploads')
        .update({
          progress,
          total_records: totalProcessed,
          files_processed: filesProcessed,
        })
        .eq('id', admin_upload_id)
    }

    // Mark upload complete
    const endTime = new Date().toISOString()
    await supabase
      .from('admin_uploads')
      .update({
        status: 'completed',
        completed_at: endTime,
        total_records: totalProcessed,
        files_processed: filesProcessed,
        error_message: results.flatMap(r => r.errors).join('; ') || null,
      })
      .eq('id', admin_upload_id)

    // Send completion email if configured
    if (upload.notify_on_complete && upload.notify_email) {
      await sendCompletionEmail(supabase, upload.notify_email, {
        uploadId: admin_upload_id,
        totalRecords: totalProcessed,
        filesProcessed,
        results,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bulk upload completed',
        totalRecords: totalProcessed,
        filesProcessed,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Bulk upload error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function processFile(
  supabase: ReturnType<typeof createClient>,
  fileData: Blob,
  areaCode: string,
  adminUploadId: string,
  logEntryId: string | undefined,
  results: ProcessingResult[],
  ftcReleaseDate?: string
): Promise<void> {
  const startTime = Date.now()
  const errors: string[] = []
  let recordsProcessed = 0
  let recordsAdded = 0
  let recordsUpdated = 0
  let recordsFailed = 0

  const csvText = await fileData.text()
  const fileSize = csvText.length

  // Parse CSV - column 0 is phone, column 1 is state
  const records = parse(csvText, {
    skipFirstRow: true,
    columns: ['phone_number', 'state'],
  }) as Array<{ phone_number: string; state?: string }>

  const BATCH_SIZE = 1000
  const MAX_RETRIES = 3

  // Process in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    let retries = 0
    let success = false

    while (retries < MAX_RETRIES && !success) {
      try {
        // Prepare batch for upsert
        const batchData = batch.map(record => ({
          phone_number: record.phone_number.replace(/\D/g, ''), // Strip non-digits
          area_code: areaCode,
          state: record.state || null,
          source: 'ftc',
          date_added: ftcReleaseDate || new Date().toISOString(),
          last_verified: new Date().toISOString(),
          is_active: true,
        })).filter(record => record.phone_number.length >= 10) // Validate phone numbers

        if (batchData.length === 0) {
          success = true
          continue
        }

        // Upsert batch
        const { error: upsertError, count } = await supabase
          .from('dnc_registry')
          .upsert(batchData, {
            onConflict: 'phone_number',
            ignoreDuplicates: false,
          })

        if (upsertError) {
          throw upsertError
        }

        recordsProcessed += batch.length
        recordsAdded += count || batch.length
        success = true

      } catch (batchError) {
        retries++
        if (retries >= MAX_RETRIES) {
          const errorMsg = batchError instanceof Error ? batchError.message : 'Batch insert failed'
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${errorMsg}`)
          recordsFailed += batch.length
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100))
        }
      }
    }

    // Update progress in log entry
    if (logEntryId && i % (BATCH_SIZE * 10) === 0) {
      const progress = ((i + BATCH_SIZE) / records.length) * 100
      await supabase
        .from('dnc_update_log')
        .update({
          records_processed: recordsProcessed,
          records_added: recordsAdded,
          records_failed: recordsFailed,
        })
        .eq('id', logEntryId)

      // Also update admin_uploads progress
      await supabase
        .from('admin_uploads')
        .update({
          progress: { [areaCode]: Math.min(progress, 100) },
        })
        .eq('id', adminUploadId)
    }
  }

  const durationMs = Date.now() - startTime

  // Finalize log entry
  if (logEntryId) {
    await supabase
      .from('dnc_update_log')
      .update({
        status: errors.length > 0 && recordsProcessed === 0 ? 'failed' : errors.length > 0 ? 'partial' : 'completed',
        records_processed: recordsProcessed,
        records_added: recordsAdded,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        error_message: errors.join('; ') || null,
        error_details: errors.length > 0 ? JSON.stringify(errors) : null,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        file_size_bytes: fileSize,
        batch_size: BATCH_SIZE,
      })
      .eq('id', logEntryId)
  }

  results.push({
    areaCode,
    recordsProcessed,
    recordsAdded,
    recordsUpdated,
    recordsFailed,
    errors,
    durationMs,
  })
}

async function sendCompletionEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
  data: {
    uploadId: string
    totalRecords: number
    filesProcessed: number
    results: ProcessingResult[]
  }
): Promise<void> {
  // Use Resend or similar email service
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.log('No RESEND_API_KEY configured, skipping email notification')
    return
  }

  const hasErrors = data.results.some(r => r.errors.length > 0)
  const subject = hasErrors
    ? `DNC Bulk Upload Completed with Errors - ${data.totalRecords.toLocaleString()} records`
    : `DNC Bulk Upload Completed Successfully - ${data.totalRecords.toLocaleString()} records`

  const resultsHtml = data.results.map(r => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${r.areaCode}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${r.recordsProcessed.toLocaleString()}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${r.recordsAdded.toLocaleString()}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${r.recordsFailed.toLocaleString()}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${(r.durationMs / 1000).toFixed(1)}s</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${r.errors.length > 0 ? '#ef4444' : '#10b981'};">
        ${r.errors.length > 0 ? r.errors.join('<br>') : 'Success'}
      </td>
    </tr>
  `).join('')

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #14b8a6;">Echo Safe</h2>
      <h3>DNC Bulk Upload Complete</h3>

      <p><strong>Upload ID:</strong> ${data.uploadId}</p>
      <p><strong>Total Records:</strong> ${data.totalRecords.toLocaleString()}</p>
      <p><strong>Files Processed:</strong> ${data.filesProcessed}</p>

      <h4>Results by Area Code:</h4>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Area Code</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Processed</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Added</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Failed</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Duration</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${resultsHtml}
        </tbody>
      </table>

      <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
        This is an automated notification from Echo Safe.
      </p>
    </div>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@echosafe.app',
        to: email,
        subject,
        html: htmlBody,
      }),
    })

    if (!response.ok) {
      console.error('Failed to send email:', await response.text())
    }
  } catch (emailError) {
    console.error('Email send error:', emailError)
  }
}
