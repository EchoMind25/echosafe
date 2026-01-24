import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  change_list_id: string
  change_type: 'additions' | 'deletions'
  is_retry?: boolean
}

interface PhoneRecord {
  phone_number: string
  area_code: string
  state?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body: RequestBody = await req.json()
    const { change_list_id, change_type, is_retry = false } = body

    if (!change_list_id || !change_type) {
      return new Response(
        JSON.stringify({ error: 'change_list_id and change_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing FTC change list: ${change_list_id}, type: ${change_type}, retry: ${is_retry}`)

    // Fetch the change list record
    const { data: changeList, error: fetchError } = await supabase
      .from('ftc_change_lists')
      .select('*')
      .eq('id', change_list_id)
      .single()

    if (fetchError || !changeList) {
      return new Response(
        JSON.stringify({ error: 'Change list not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark as processing
    const startTime = Date.now()
    await supabase
      .from('ftc_change_lists')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', change_list_id)

    try {
      // Download and parse the file
      let phoneNumbers: PhoneRecord[] = []

      if (changeList.file_url) {
        // Download from storage
        const response = await fetch(changeList.file_url)
        const text = await response.text()
        phoneNumbers = parsePhoneFile(text, changeList.area_codes)
      } else {
        // Get file from storage bucket
        const filePath = `ftc-change-lists/${change_list_id}`
        const { data: files } = await supabase.storage.from('admin-uploads').list(filePath)

        if (files && files.length > 0) {
          const { data: fileData } = await supabase.storage
            .from('admin-uploads')
            .download(`${filePath}/${files[0].name}`)

          if (fileData) {
            const text = await fileData.text()
            phoneNumbers = parsePhoneFile(text, changeList.area_codes)
          }
        }
      }

      const totalRecords = phoneNumbers.length
      const BATCH_SIZE = 1000
      const totalBatches = Math.ceil(totalRecords / BATCH_SIZE)

      // Update total records
      await supabase
        .from('ftc_change_lists')
        .update({
          total_records: totalRecords,
          total_batches: totalBatches,
        })
        .eq('id', change_list_id)

      let processedCount = 0
      let failedCount = 0
      let skippedCount = 0

      // Process in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * BATCH_SIZE
        const batch = phoneNumbers.slice(batchStart, batchStart + BATCH_SIZE)

        if (change_type === 'additions') {
          // Process additions - add to DNC registry
          const result = await processAdditions(supabase, batch)
          processedCount += result.processed
          skippedCount += result.skipped
          failedCount += result.failed
        } else {
          // Process deletions - move to deleted tracking
          const result = await processDeletions(supabase, batch)
          processedCount += result.processed
          skippedCount += result.skipped
          failedCount += result.failed
        }

        // Update progress
        const progressPercent = Math.round(((batchIndex + 1) / totalBatches) * 100)
        await supabase
          .from('ftc_change_lists')
          .update({
            processed_records: processedCount,
            failed_records: failedCount,
            skipped_records: skippedCount,
            progress_percent: progressPercent,
            current_batch: batchIndex + 1,
          })
          .eq('id', change_list_id)

        console.log(`Batch ${batchIndex + 1}/${totalBatches} complete. Progress: ${progressPercent}%`)
      }

      // Mark as completed
      const duration = Date.now() - startTime
      await supabase
        .from('ftc_change_lists')
        .update({
          status: 'completed',
          progress_percent: 100,
          processed_records: processedCount,
          failed_records: failedCount,
          skipped_records: skippedCount,
          processing_completed_at: new Date().toISOString(),
          processing_duration_ms: duration,
        })
        .eq('id', change_list_id)

      // Update FTC subscription last_update timestamp
      for (const areaCode of changeList.area_codes) {
        await supabase
          .from('ftc_subscriptions')
          .update({
            last_update_at: new Date().toISOString(),
            last_change_list_id: change_list_id,
          })
          .eq('area_code', areaCode)
      }

      // Log to dnc_update_log
      await supabase.from('dnc_update_log').insert({
        area_code: changeList.area_codes.join(','),
        update_type: change_type,
        records_added: change_type === 'additions' ? processedCount : 0,
        records_removed: change_type === 'deletions' ? processedCount : 0,
        total_records: totalRecords,
        status: 'completed',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round(duration / 1000),
        source_file: changeList.file_name,
        ftc_release_date: changeList.ftc_file_date,
      })

      return new Response(
        JSON.stringify({
          success: true,
          processed: processedCount,
          failed: failedCount,
          skipped: skippedCount,
          duration_ms: duration,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (processingError) {
      console.error('Processing error:', processingError)

      // Mark as failed
      await supabase
        .from('ftc_change_lists')
        .update({
          status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : 'Processing failed',
          error_details: { error: String(processingError) },
          processing_completed_at: new Date().toISOString(),
          processing_duration_ms: Date.now() - startTime,
        })
        .eq('id', change_list_id)

      throw processingError
    }

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Parse phone numbers from file content
 */
function parsePhoneFile(content: string, areaCodes: string[]): PhoneRecord[] {
  const lines = content.split(/\r?\n/)
  const records: PhoneRecord[] = []
  const areaCodeSet = new Set(areaCodes)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Extract phone number (handle CSV with columns or plain text)
    let phone = trimmed
    if (trimmed.includes(',')) {
      // CSV format - take first column
      phone = trimmed.split(',')[0].trim()
    }

    // Clean phone number - remove non-digits
    const cleanPhone = phone.replace(/\D/g, '')

    // Validate: must be 10 digits (US format)
    if (cleanPhone.length === 10) {
      const areaCode = cleanPhone.substring(0, 3)

      // Only include if area code matches our subscriptions
      if (areaCodes.length === 0 || areaCodeSet.has(areaCode)) {
        records.push({
          phone_number: cleanPhone,
          area_code: areaCode,
        })
      }
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      // Handle 11-digit with leading 1
      const phone10 = cleanPhone.substring(1)
      const areaCode = phone10.substring(0, 3)

      if (areaCodes.length === 0 || areaCodeSet.has(areaCode)) {
        records.push({
          phone_number: phone10,
          area_code: areaCode,
        })
      }
    }
  }

  return records
}

/**
 * Process additions - add numbers to DNC registry
 */
async function processAdditions(
  supabase: ReturnType<typeof createClient>,
  records: PhoneRecord[]
): Promise<{ processed: number; skipped: number; failed: number }> {
  let processed = 0
  let skipped = 0
  let failed = 0

  // Prepare records for upsert
  const dncRecords = records.map(r => ({
    phone_number: r.phone_number,
    area_code: r.area_code,
    source: 'ftc',
    record_status: 'active',
    last_updated: new Date().toISOString(),
    ftc_release_date: new Date().toISOString().split('T')[0],
  }))

  try {
    // Upsert in chunks of 100
    const CHUNK_SIZE = 100
    for (let i = 0; i < dncRecords.length; i += CHUNK_SIZE) {
      const chunk = dncRecords.slice(i, i + CHUNK_SIZE)

      const { error } = await supabase
        .from('dnc_registry')
        .upsert(chunk, {
          onConflict: 'phone_number',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error('Upsert error:', error)
        failed += chunk.length
      } else {
        processed += chunk.length
      }
    }
  } catch (err) {
    console.error('Addition processing error:', err)
    failed = records.length - processed
  }

  return { processed, skipped, failed }
}

/**
 * Process deletions - move numbers from DNC to deleted tracking
 */
async function processDeletions(
  supabase: ReturnType<typeof createClient>,
  records: PhoneRecord[]
): Promise<{ processed: number; skipped: number; failed: number }> {
  let processed = 0
  let skipped = 0
  let failed = 0

  for (const record of records) {
    try {
      // Check if number exists in DNC registry
      const { data: existing } = await supabase
        .from('dnc_registry')
        .select('*')
        .eq('phone_number', record.phone_number)
        .single()

      if (!existing) {
        // Number not in registry, skip
        skipped++
        continue
      }

      // Check if already in deleted_numbers tracking
      const { data: deletedRecord } = await supabase
        .from('dnc_deleted_numbers')
        .select('id, times_added_removed')
        .eq('phone_number', record.phone_number)
        .single()

      if (deletedRecord) {
        // Increment pattern counter (suspicious if repeated)
        await supabase
          .from('dnc_deleted_numbers')
          .update({
            times_added_removed: (deletedRecord.times_added_removed || 1) + 1,
            deleted_from_dnc_date: new Date().toISOString().split('T')[0],
            delete_after: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', deletedRecord.id)
      } else {
        // First time deleted, create tracking record
        await supabase
          .from('dnc_deleted_numbers')
          .insert({
            phone_number: record.phone_number,
            area_code: record.area_code,
            state: existing.state,
            deleted_from_dnc_date: new Date().toISOString().split('T')[0],
            original_add_date: existing.created_at,
            times_added_removed: 1,
            delete_after: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            source: 'ftc',
          })
      }

      // Remove from active DNC registry
      await supabase
        .from('dnc_registry')
        .delete()
        .eq('phone_number', record.phone_number)

      processed++

    } catch (err) {
      console.error(`Error processing deletion for ${record.phone_number}:`, err)
      failed++
    }
  }

  return { processed, skipped, failed }
}
