const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

async function callClaude(systemPrompt, userMessage) {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

export async function aiClassifyIncident(description) {
  const system = `You are a security operations AI. Given an incident description, respond ONLY with a valid JSON object (no markdown, no backticks) with exactly these fields:
{
  "type": one of ["Unauthorized Access","Suspicious Person","Theft / Vandalism","Fire / Safety Hazard","Medical Emergency","Equipment Malfunction","Disturbance / Altercation","Trespassing","Cyber / IT Security","Other"],
  "severity": one of ["low","medium","high","critical"],
  "confidence": number 0-100
}`
  const text = await callClaude(system, `Classify this security incident:\n\n"${description}"`)
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { type: 'Other', severity: 'medium', confidence: 50 }
  }
}

export async function aiGenerateSummary(incidentData) {
  const system = `You are a security operations AI. Write a concise, professional incident summary for management review in 2-3 sentences. Be factual, clear, and use formal security report language. Do not use bullet points.`
  const prompt = `Generate a professional summary for this incident:
Type: ${incidentData.type}
Severity: ${incidentData.severity}
Location: ${incidentData.location} - ${incidentData.zone || ''}
Description: ${incidentData.description}
Authorities notified: ${incidentData.authorities_notified || 'None'}`
  return await callClaude(system, prompt)
}

export async function aiEscalationAdvice(incidentData) {
  const system = `You are a security operations AI advisor. Based on an incident, provide 2-3 specific, actionable escalation recommendations for the security team. Be brief and practical. Respond ONLY with a JSON array of strings, no markdown, no backticks. Example: ["Notify shift supervisor immediately","Secure perimeter at Gate B"]`
  const prompt = `Incident: ${incidentData.type} (${incidentData.severity} severity)
Location: ${incidentData.location}
Description: ${incidentData.description}`
  const text = await callClaude(system, prompt)
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return ['Notify shift supervisor', 'Document all evidence', 'Increase patrol frequency in area']
  }
}

export async function aiGenerateReportNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `RPT-${y}${m}${d}-${rand}`
}