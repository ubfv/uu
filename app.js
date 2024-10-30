// استيراد المكتبات اللازمة
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// خدمة الواجهة الأمامية HTML/CSS/JavaScript
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>لعبة اختبار الذاكرة الجماعي</title>
        <style>
            /* تنسيقات الصفحة الخارجية */
            body {
                font-family: Arial, sans-serif;
                background-color: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            h1 {
                color: #333;
                text-align: center;
            }
            #game {
                display: grid;
                grid-template-columns: repeat(4, 100px);
                grid-gap: 10px;
                margin-top: 20px;
            }
            .tile {
                width: 100px;
                height: 100px;
                background-color: #8c8c8c;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: #fff;
                cursor: pointer;
                border-radius: 10px;
                transition: background-color 0.3s;
            }
            .tile.revealed {
                background-color: #4caf50;
            }
        </style>
    </head>
    <body>
        <div id="container">
            <h1>لعبة اختبار الذاكرة الجماعي</h1>
            <div id="game"></div>
            <p id="status">انتظر اللاعبين الآخرين...</p>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            // الاتصال بالخادم
            const socket = io();

            // تهيئة اللعبة
            const gameContainer = document.getElementById('game');
            const statusText = document.getElementById('status');
            let gridSize = 16;  // عدد الخانات
            let revealedTiles = [];

            // إنشاء شبكة اللعبة
            function initializeGame() {
                gameContainer.innerHTML = '';
                for (let i = 0; i < gridSize; i++) {
                    const tile = document.createElement('div');
                    tile.classList.add('tile');
                    tile.dataset.index = i;
                    tile.addEventListener('click', () => handleTileClick(i));
                    gameContainer.appendChild(tile);
                }
            }

            // حدث عند النقر على الخانات
            function handleTileClick(index) {
                if (revealedTiles.length < 2) {
                    revealedTiles.push(index);
                    updateTileDisplay();
                    socket.emit('tileReveal', index);
                }
            }

            // تحديث عرض الخانات
            function updateTileDisplay() {
                const tiles = document.querySelectorAll('.tile');
                tiles.forEach(tile => tile.classList.remove('revealed'));
                revealedTiles.forEach(index => tiles[index].classList.add('revealed'));

                if (revealedTiles.length === 2) {
                    setTimeout(checkMatch, 1000);
                }
            }

            // التحقق من تطابق الخانات
            function checkMatch() {
                const [index1, index2] = revealedTiles;
                if (index1 !== index2 && index1 % 8 === index2 % 8) {
                    statusText.textContent = 'تطابق!';
                } else {
                    statusText.textContent = 'لا يوجد تطابق!';
                    revealedTiles = [];
                }
                updateTileDisplay();
            }

            // استقبال كشف الخانات من اللاعبين الآخرين
            socket.on('tileReveal', index => {
                if (!revealedTiles.includes(index)) {
                    revealedTiles.push(index);
                    updateTileDisplay();
                }
            });

            // بدء اللعبة عند الاتصال بالخادم
            socket.on('startGame', () => {
                statusText.textContent = 'ابدأ اللعب!';
                initializeGame();
            });
        </script>
    </body>
    </html>
    `);
});

// إعداد Socket.IO لأحداث اللعبة
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);
    socket.emit('startGame');  // بدء اللعبة عند الاتصال

    socket.on('tileReveal', (index) => {
        socket.broadcast.emit('tileReveal', index);  // إرسال حركة اللاعب لبقية اللاعبين
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
