import './style.css'

// ==========================================
// デバッグログ機能
// ==========================================
const debugArea = document.createElement('div');
debugArea.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: auto;
    background: rgba(0, 0, 0, 0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 11px;
    z-index: 10000;
    padding: 8px;
    pointer-events: none; /* 下の要素をクリックできるように */
    border-top: 1px solid #333;
`;
document.body.appendChild(debugArea);

const log = (msg) => {
    const d = new Date();
    const ts = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    const p = document.createElement('div');
    p.textContent = `[${ts}] ${msg}`;
    p.style.borderBottom = '1px solid #333';

    // 最新を上に
    debugArea.prepend(p);

    // 3行以上になったら古いものを消す
    while (debugArea.children.length > 3) {
        debugArea.removeChild(debugArea.lastChild);
    }

    console.log(msg);
};

log('Debug mode initialized.');

//要素取得
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const cameraInput = document.getElementById('cameraInput');
const cameraBtn = document.getElementById('cameraBtn');
const shareBtn = document.getElementById('shareBtn');
const filenameDisplay = document.getElementById('filenameDisplay');
const qualitySlider = document.getElementById('qualitySlider');
const qualityVal = document.getElementById('qualityVal');

let currentBlob = null;
let currentFileName = '';
let originalImage = null; // 元画質を保持

// ファイル名生成 (例: IMG_YYYYMMDD_HHmm.jpg)
const getFileName = () => {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 5).replace(/:/g, '');
    return `IMG_${ymd}_${time}.jpg`;
};

// 画質・サイズ計算と反映
const updatePreview = () => {
    try {
        if (!originalImage) return;

        log('updatePreview started');

        // スライダー値 (0:最高 - 100:軽量)
        // 左端(0)   -> Max: 4096, Q: 0.95
        // 右端(100) -> Max: 2048, Q: 0.80

        const val = parseInt(qualitySlider.value, 10);
        const ratio = val / 100; // 0.0 - 1.0

        const targetMaxSize = 4096 - ((4096 - 2048) * ratio);
        const targetQuality = 0.95 - ((0.95 - 0.80) * ratio);

        // Canvasサイズ計算
        let width = originalImage.width;
        let height = originalImage.height;

        if (width > height) {
            if (width > targetMaxSize) {
                height *= targetMaxSize / width;
                width = targetMaxSize;
            }
        } else {
            if (height > targetMaxSize) {
                width *= targetMaxSize / height;
                height = targetMaxSize;
            }
        }
        width = Math.floor(width);
        height = Math.floor(height);

        canvas.width = width;
        canvas.height = height;

        // 描画
        log(`Drawing canvas: ${width}x${height}`);
        ctx.drawImage(originalImage, 0, 0, width, height);

        // Blob化
        log('Starting toBlob...');
        canvas.toBlob((blob) => {
            log('toBlob callback received');
            if (blob) {
                currentBlob = blob;
                // 既にファイル名があれば維持、なければ生成（初回）
                if (!currentFileName) currentFileName = getFileName();

                filenameDisplay.textContent = currentFileName;
                shareBtn.disabled = false;

                const mb = (blob.size / 1024 / 1024).toFixed(2);
                shareBtn.querySelector('.btn-sub').textContent = `JPEG画像 (${mb} MB)`;

                // ラベル更新
                qualityVal.textContent = `${Math.max(width, height)}px / Q:${targetQuality.toFixed(2)}`;
                log('Preview updated successfully');

            } else {
                log('Blob conversion failed (null)');
                alert('画像の変換に失敗しました');
                drawPlaceholder(); // エラー時はLoading解除
            }
        }, 'image/jpeg', targetQuality);

    } catch (e) {
        log('Error in updatePreview: ' + e.message);
        alert('予期せぬエラー: ' + e.message);
        drawPlaceholder(); // エラー時はLoading解除
    }
};

// スライダー操作イベント
qualitySlider.addEventListener('input', () => {
    // 連続動作を軽くするためリクエストがあるかもだが、まずは現代の端末性能を信じて直結
    if (originalImage) updatePreview();
});


// 初期表示（説明など）
const drawPlaceholder = () => {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('NO IMAGE', canvas.width / 2, canvas.height / 2);
};
drawPlaceholder();

// ボタンクリックでカメラ起動
cameraBtn.addEventListener('click', () => {
    log('Camera button clicked');
    // iOSではユーザーアクション直下でないと反応しないことがあるため確認
    try {
        cameraInput.click();
        log('Input click triggered');
    } catch (e) {
        log('Input click failed: ' + e.message);
    }
});

// キャンセル検知の試み（完璧ではないがFocus戻りで判定）
window.addEventListener('focus', () => {
    // input type=fileを開いて戻ってきたタイミングの可能性
    // log('Window focused'); // ログが流れすぎるので必要な時のみ有効化
});

// 画像選択（撮影）後の処理
cameraInput.addEventListener('change', (e) => {
    log('Input change event!');

    if (e.target.files.length === 0) {
        log('No file selected (User cancelled?)');
        return;
    }

    const file = e.target.files[0];
    log(`File selected: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Loading表示
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillText('Processing...', canvas.width / 2, canvas.height / 2);

    const reader = new FileReader();
    reader.onload = (event) => {
        log('FileReader loaded');
        const img = new Image();
        img.onload = () => {
            log(`Image loaded: ${img.width}x${img.height}`);

            // Global変数に保持
            originalImage = img;

            // 初回変換（スライダー値に基づいて）
            updatePreview();

            log('Initial preview updated');
        };
        img.onerror = (err) => log('Image load error');
        img.src = event.target.result;
    };
    reader.onerror = (err) => log('FileReader error: ' + err);
});

// 共有・保存ボタン
shareBtn.addEventListener('click', async () => {
    log('Share button clicked');
    if (!currentBlob) return;

    try {
        const file = new File([currentBlob], currentFileName, { type: 'image/jpeg' });

        if (navigator.share) {
            log('Calling navigator.share...');
            await navigator.share({
                files: [file],
                title: '写真の保存',
                text: '撮影された写真です'
            });
            log('Shared successfully');
        } else {
            log('navigator.share not supported');
            alert('共有機能がサポートされていません');
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            log('Share error: ' + err.message);
            alert('共有できませんでした: ' + err.message);
        } else {
            log('Share cancelled by user');
        }
    }
});
