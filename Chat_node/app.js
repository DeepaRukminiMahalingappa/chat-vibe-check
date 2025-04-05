const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Sentiment = require('sentiment');
const fs = require('fs');

const app = express();
const port = 8000;
const sentiment = new Sentiment();

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper to clean message text
const cleanMessage = (text) => text.replace(/\s+/g, ' ').trim();

app.post('/upload', upload.single('chat'), async (req, res) => {
    try {
        const chatText = req.file.buffer.toString();
        const lines = chatText.split('\n');
        const parsedMessages = [];

        for (const line of lines) {
            const match = line.match(
                /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?:\s?[apAP][mM]))\s*-\s([^:]+):\s(.+)$/
            );

            if (match) {
                const date = match[1];
                const time = match[2];
                const sender = match[3];
                const message = cleanMessage(match[4]);
                const sentimentScore = sentiment.analyze(message).score;

                parsedMessages.push({
                    date,
                    time,
                    sender,
                    message,
                    sentiment: sentimentScore,
                });
            } else {
                console.warn('Unmatched line:', line);
            }
        }

        // Save messages to a file (for Week 8 data persistence)
        fs.writeFileSync('messages.json', JSON.stringify(parsedMessages, null, 2));

        res.json({ messages: parsedMessages });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Failed to process chat file.' });
    }
});

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});
