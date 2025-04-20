'use client';

import { useState, FormEvent } from 'react';

export default function BrochureForm() {
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
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    headline: string;
    summary: string;
    bulletPoints: string[] | string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/generate-brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      alert('Something went wrong while generating the brochure.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderTextarea = (
    label: string,
    name: keyof typeof formData,
    rows = 3
  ) => (
    <div>
      <label htmlFor={name} className="block font-medium mb-1">
        {label}
      </label>
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
  );

  return (
    <div className="max-w-3xl mx-auto p-4">
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
          className="mt-4 bg-indigo-600 text-white font-semibold px-4 py-2 rounded hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Brochure'}
        </button>
      </form>

      {/* Show results if available */}
      {result && (
        <div className="mt-10 space-y-6">
          {/* Headline */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-semibold">Headline</h2>
              <button
                onClick={() => copyToClipboard(result.headline)}
                className="text-blue-600 underline text-sm"
              >
                Copy
              </button>
            </div>
            <p className="bg-gray-100 p-3 rounded">{result.headline}</p>
          </div>

          {/* Summary */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-semibold">Summary</h2>
              <button
                onClick={() => copyToClipboard(result.summary)}
                className="text-blue-600 underline text-sm"
              >
                Copy
              </button>
            </div>
            <p className="bg-gray-100 p-3 rounded whitespace-pre-line">
              {result.summary}
            </p>
          </div>

          {/* Bullet Points */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-semibold">Bullet Points</h2>
              <button
                onClick={() =>
                  copyToClipboard(
                    Array.isArray(result.bulletPoints)
                      ? result.bulletPoints.join('\n')
                      : typeof result.bulletPoints === 'string'
                      ? result.bulletPoints
                      : ''
                  )
                }
                className="text-blue-600 underline text-sm"
              >
                Copy All
              </button>
            </div>
            <ul className="bg-gray-100 p-3 rounded list-disc list-inside space-y-1">
              {Array.isArray(result.bulletPoints) ? (
                result.bulletPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))
              ) : (
                <li>{result.bulletPoints ?? 'No bullet points returned.'}</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
