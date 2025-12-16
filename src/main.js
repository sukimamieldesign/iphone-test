import './style.css'

// 要素の取得
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const shareBtn = document.getElementById('shareBtn');
const filenameDisplay = document.getElementById('filenameDisplay');

// ファイル名生成 (例: sample_YYYYMMDD_HHmm.jpg)
const getFileName = () => {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 5).replace(/:/g, '');
    return `sample_${ymd}_${time}.jpg`;
};

let currentFileName = getFileName();

// 画像を描画する関数
const drawImage = () => {
    // 背景
    // 綺麗なグラデーション
    const gradient = ctx.createLinearGradient(0, 0, 600, 600);
    gradient.addColorStop(0, '#4facfe');
    gradient.addColorStop(1, '#00f2fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 600);

    // テキスト設定
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    // メインテキスト
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText('IPHONE', 300, 240);
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText('TEST IMAGE', 300, 320);

    // 日付
    const dateStr = new Date().toLocaleString();
    ctx.font = '30px sans-serif';
    ctx.fillText(dateStr, 300, 450);

    // ファイル名更新
    currentFileName = getFileName();
    filenameDisplay.textContent = currentFileName;
};

// 初期描画
drawImage();

// 1秒ごとに時間を更新して再描画（動きをつける）
setInterval(drawImage, 1000);

// CanvasをBlobに変換して共有する機能
const shareImage = async () => {
    try {
        // ボタンを一時的に無効化
        shareBtn.style.opacity = '0.7';

        // CanvasをBlob化
        canvas.toBlob(async (blob) => {
            if (!blob) {
                alert('画像生成に失敗しました');
                return;
            }

            // 指定したファイル名でFileオブジェクトを作成
            const file = new File([blob], currentFileName, { type: 'image/jpeg' });

            // 共有APIが使えるかチェック
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'サンプル画像',
                        text: 'iPhoneから生成された画像です'
                    });
                    console.log('共有成功');
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('共有エラー:', err);
                        alert('共有できませんでした: ' + err.message);
                    }
                }
            } else {
                alert('このブラウザは共有機能に対応していません。');
            }

            shareBtn.style.opacity = '1';
        }, 'image/jpeg', 0.9);

    } catch (e) {
        console.error(e);
        alert('エラーが発生しました');
        shareBtn.style.opacity = '1';
    }
};

// イベントリスナー
shareBtn.addEventListener('click', shareImage);
