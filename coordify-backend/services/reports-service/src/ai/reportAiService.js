import { env } from '../config/env.js'

const cleanJsonFence = (value) => {
  return value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
}

const fallbackTemplate = (report) => {
  const title = report.type === 'project' ? `Project ${report.projectId}` : `Team (${report.scope || 'all'})`
  const summary = report.summary || {}
  const summaryLines = Object.entries(summary).map(([key, value]) => `${key}: ${value}`)

  return {
    narrativeText: `Report for ${title}. Key metrics: ${summaryLines.join(', ')}.`,
    narrativeHtml: `<h3>Report for ${title}</h3><p>Key metrics: ${summaryLines.join(', ')}.</p>`,
    highlights: summaryLines.slice(0, 3),
    chartData: Object.entries(summary).map(([metric, value]) => ({
      metric,
      value: Number(value) || 0,
    })),
  }
}

const buildPrompt = (report) => {
  return [
    'You are an analytics assistant for a project management platform.',
    'Given the report JSON below, produce concise executive output.',
    'Return strict JSON only with keys: narrativeText, narrativeHtml, highlights, chartData.',
    'chartData should be an array of { metric, value } numeric values for charts.',
    'narrativeHtml can contain only simple tags: h3, p, ul, li, strong.',
    `Report JSON: ${JSON.stringify(report)}`,
  ].join('\n')
}

const requestGemini = async (report) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(report) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`)
  }

  const payload = await response.json()
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini response missing text content')
  }

  const parsed = JSON.parse(cleanJsonFence(text))
  return {
    narrativeText: String(parsed?.narrativeText || ''),
    narrativeHtml: String(parsed?.narrativeHtml || ''),
    highlights: Array.isArray(parsed?.highlights) ? parsed.highlights.map((item) => String(item)) : [],
    chartData: Array.isArray(parsed?.chartData)
      ? parsed.chartData.map((entry) => ({
          metric: String(entry?.metric || 'metric'),
          value: Number(entry?.value) || 0,
        }))
      : [],
  }
}

export const generateAiReport = async (report) => {
  if (!env.aiReportsEnabled || !env.geminiApiKey) {
    return {
      ...fallbackTemplate(report),
      provider: 'fallback',
      model: 'deterministic-template',
    }
  }

  try {
    const aiResult = await requestGemini(report)
    return {
      ...aiResult,
      provider: 'gemini',
      model: env.geminiModel,
    }
  } catch (error) {
    console.error('AI report generation failed, falling back')
    console.error(error)
    return {
      ...fallbackTemplate(report),
      provider: 'fallback',
      model: 'deterministic-template',
    }
  }
}
