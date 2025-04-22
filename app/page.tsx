'use client'

import { useState, FormEvent } from 'react'
import Head from 'next/head'

export default function BrochureForm() {
  // All the fields we’ll send to OpenAI
  const [formData, setFormData] = useState({
    property_bullets: '',
    entrance: '',
    kitchen: '',
    living_room: '',
    heating: '',
    glazing: '',
    bedrooms: '',
    bathrooms: '',
    outside: '',
    other_key_features: '',
    study: '',
    dining_room: '',
    drawing_room: '',
    additional_reception: '',
    shower_room: '',
    guest_cloakroom: '',
    utility_room: '',
  })
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setOutput(null)
    try {
      const res = await fetch('/api/generate-brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const body = await res.json()
      if (!res.ok || body.error) throw new Error(body.error || 'Generation failed')
      setOutput(body.brochureText)
    } catch (err) {
      console.error(err)
      alert('Something went wrong while generating the brochure.')
    } finally {
      setLoading(false)
    }
  }

  // Helper to render each textarea
  const renderTextarea = (label: string, name: keyof typeof formData, rows = 3) => (
    <div>
      <label htmlFor={name} className="block font-medium mb-1">{label}</label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={formData[name]}
        onChange={handleChange}
        className="w-full border border-gray-300 p-2 rounded"
        placeholder={`Describe the ${label.toLowerCase()}...`}
      />
    </div>
  )

  return (
    <>
      <Head><title>Henderson Connellan Brochure Writer</title></Head>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">
          Henderson Connellan Brochure Writer
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderTextarea('Property Bullets', 'property_bullets', 2)}
          {renderTextarea('Entrance', 'entrance')}
          {renderTextarea('Kitchen', 'kitchen')}
          {renderTextarea('Living Room', 'living_room')}
          {renderTextarea('Heating', 'heating')}
          {renderTextarea('Glazing', 'glazing')}
          {renderTextarea('Bedrooms', 'bedrooms')}
          {renderTextarea('Bathrooms', 'bathrooms')}
          {renderTextarea('Outside', 'outside')}
          {renderTextarea('Other Key Features', 'other_key_features')}
          {renderTextarea('Study', 'study')}
          {renderTextarea('Dining Room', 'dining_room')}
          {renderTextarea('Drawing Room', 'drawing_room')}
          {renderTextarea('Additional Reception', 'additional_reception')}
          {renderTextarea('Shower Room', 'shower_room')}
          {renderTextarea('Guest Cloakroom', 'guest_cloakroom')}
          {renderTextarea('Utility Room', 'utility_room', 2)}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate Brochure'}
          </button>
        </form>

        {output && (
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-semibold mb-2">Generated Brochure</h2>
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>
    </>
  )
}
