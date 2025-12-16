import './style.css'

// 要素取得
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const cameraInput = document.getElementById('cameraInput');
const cameraBtn = document.getElementById('cameraBtn');
const shareBtn = document.getElementById('shareBtn');
const filenameDisplay = document.getElementById('filenameDisplay');

let currentBlob = null;
let currentFileName = '';

// ファイル名生成 (例: IMG_YYYYMMDD_HHmm.jpg)
const getFileName = () => {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 5).replace(/:/g, '');
    return `IMG_${ymd}_${time}.jpg`;
};

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
    cameraInput.click();
});

// 画像選択（撮影）後の処理
cameraInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Loading表示
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillText('Processing...', canvas.width / 2, canvas.height / 2);

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // 画像のサイズに合わせてCanvasサイズを変更（高画質維持）
            // ただし大きすぎるとアプリが落ちるので最大サイズを制限する
            const MAX_SIZE = 4096;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // 描画
            ctx.drawImage(img, 0, 0, width, height);

            // JPEG変換（再エンコード）してBlob化
            // 品質0.95で保存
            canvas.toBlob((blob) => {
                if (blob) {
                    currentBlob = blob;
                    currentFileName = getFileName();

                    filenameDisplay.textContent = currentFileName;
                    shareBtn.disabled = false;
                    shareBtn.querySelector('.btn-sub').textContent = 'JPEG画像 (' + (blob.size / 1024 / 1024).toFixed(2) + ' MB)';
                } else {
                    alert('画像の変換に失敗しました');
                }
            }, 'image/jpeg', 0.95); // ★ここで強制JPEG化
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// 共有・保存ボタン
shareBtn.addEventListener('click', async () => {
    if (!currentBlob) return;

    try {
        const file = new File([currentBlob], currentFileName, { type: 'image/jpeg' });

        if (navigator.share) {
            await navigator.share({
                files: [file],
                title: '写真の保存',
                text: '撮影された写真です'
            });
            console.log('Shared successfully');
        } else {
            alert('共有機能がサポートされていません');
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Share error:', err);
            alert('共有できませんでした: ' + err.message);
        }
    }
});
