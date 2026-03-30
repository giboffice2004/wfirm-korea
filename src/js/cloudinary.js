// ================================================================
//  Cloudinary 이미지 업로드 모듈
//  cloud_name: dda5xcnyf / upload_preset: wfirm-korea (Unsigned)
// ================================================================

const CLOUD_NAME    = "dda5xcnyf";
const UPLOAD_PRESET = "wfirm-korea";
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;


/**
 * 파일을 Cloudinary에 업로드하고 URL 반환
 * @param {File}     file        - 업로드할 이미지 파일
 * @param {Function} onProgress  - 진행률 콜백 (0~100)
 * @returns {Promise<string>}    - 업로드된 이미지 URL
 */
export async function uploadToCloudinary(file, onProgress) {
  const formData = new FormData();
  formData.append("file",         file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder",       "wfirm-korea");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_URL, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        // 최적화된 URL 반환 (WebP 자동 변환, 품질 자동 최적화)
        const optimizedUrl = data.secure_url.replace(
          "/upload/",
          "/upload/f_auto,q_auto/"
        );
        resolve(optimizedUrl);
      } else {
        reject(new Error(`업로드 실패: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("네트워크 오류"));
    xhr.send(formData);
  });
}

/**
 * 파일 입력 요소와 업로드 버튼을 연결하는 헬퍼
 * @param {string}   containerId - 업로드 결과 URL이 들어갈 input의 ID
 * @param {string}   type        - 'c'(행사), 'o'(사무국), 'h'(히어로)
 */
export function createUploadWidget(container, onUploaded) {
  const input   = document.createElement("input");
  input.type    = "file";
  input.accept  = "image/*";
  input.style   = "display:none";

  const zone    = document.createElement("div");
  zone.className = "upload-zone";
  zone.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i><p>이미지를 선택하거나 드래그하세요</p>`;

  const progressBar = document.createElement("div");
  progressBar.style = "display:none; height:6px; background:#e2e8f0; border-radius:6px; margin-top:8px; overflow:hidden;";
  const bar = document.createElement("div");
  bar.style = "height:100%; background:var(--accent); width:0%; transition:.2s; border-radius:6px;";
  progressBar.appendChild(bar);

  zone.onclick = () => input.click();

  // 드래그 앤 드롭
  zone.addEventListener("dragover",  (e) => { e.preventDefault(); zone.style.borderColor = "var(--accent)"; });
  zone.addEventListener("dragleave", ()  => { zone.style.borderColor = ""; });
  zone.addEventListener("drop",      (e) => {
    e.preventDefault();
    zone.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  });

  input.addEventListener("change", () => {
    if (input.files[0]) handleUpload(input.files[0]);
  });

  async function handleUpload(file) {
    zone.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><p>업로드 중...</p>`;
    progressBar.style.display = "block";
    bar.style.width = "0%";

    try {
      const url = await uploadToCloudinary(file, (pct) => {
        bar.style.width = pct + "%";
      });
      zone.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--accent)"></i><p style="color:var(--primary);font-weight:900;">${file.name}</p>`;
      progressBar.style.display = "none";
      if (onUploaded) onUploaded(url);
    } catch (err) {
      zone.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#ff4d4d"></i><p style="color:#ff4d4d;">업로드 실패 — 다시 시도</p>`;
      progressBar.style.display = "none";
      console.error("[Cloudinary]", err);
    }
  }

  container.appendChild(zone);
  container.appendChild(progressBar);
  container.appendChild(input);
}
