import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fieldId = formData.get('fieldId') as string

    if (!file || !fieldId) {
      return NextResponse.json({ error: 'Missing file or fieldId' }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const timestamp = Date.now()
    const filePath = `forms/${fieldId}/${timestamp}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('review-forms')
      .upload(filePath, new Uint8Array(fileBuffer), { contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { data } = supabase.storage.from('review-forms').getPublicUrl(filePath)

    return NextResponse.json({ success: true, url: data.publicUrl, name: file.name })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
