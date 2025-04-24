const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: './credenv' });

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3002;

// Basic fallback responses
const fallbackResponses = {
    'hello': 'Hi there! How can I help you?',
    'hi': 'Hello! How can I assist you today?',
    'how are you': 'I\'m doing great, thanks for asking! How about you?',
    'what is your name': 'I\'m ChatBot, nice to meet you!',
    'bye': 'Goodbye! Have a great day!',
    'default': 'I\'m not sure how to respond to that. Could you try rephrasing?'
};

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.input_value.toLowerCase().trim();
        
        // Check for basic responses first
        if (fallbackResponses[userMessage]) {
            return res.json({ result: fallbackResponses[userMessage] });
        }

        const API_URL = process.env.API_URL;
        const API_TOKEN = process.env.API_TOKEN;
        const AUTH_TOKEN = process.env.AUTH_TOKEN;

        console.log('Sending request to API:', req.body);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({
                input_value: userMessage,
                output_type: 'chat',
                input_type: 'chat'
            })
        });

        if (!response.ok) {
            console.error('API Error Status:', response.status);
            const errorText = await response.text();
            console.error('API Error Text:', errorText);
            
            // Return fallback response on API error
            return res.json({ result: fallbackResponses['default'] });
        }

        const data = await response.json();
        console.log('API Response:', data);

        // Handle different response formats
        let result;
        if (data.outputs) {
            result = data.outputs;
        }
        else {
            result = fallbackResponses['default'];
        }

        res.json({ result });
    } catch (error) {
        console.error('Proxy Error:', error);
        res.json({ result: fallbackResponses['default'] });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
    console.log('Ready to handle chat requests...');
});
