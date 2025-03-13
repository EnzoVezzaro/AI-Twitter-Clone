// Simulated AI response generator
import axios from 'axios';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;

// Tweet generation using Groq API
export async function generateTweet(prompt: string): Promise<string | undefined> {
  const systemPrompt = `You are a creative AI assistant that generates engaging tweets. 
  Create a single tweet about the following topic. Include relevant hashtags and emojis.
  Keep it under 280 characters and make it sound natural and engaging.`;

  try {
    const response = await axios.post(API_URL, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 150,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    });
    console.log('Response:', response.data);
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.log(error);
    new Error('Failed to generate tweet');
  }
}