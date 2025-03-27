console.log("✅ ChatGPT Chat Remover is running");

if (window.chatRemoverAllSelected === undefined) {
	window.chatRemoverAllSelected = false;
}
if (window.chatRemoverObserverInitialized === undefined) {
	window.chatRemoverObserverInitialized = false;
}

function extractAccessTokenFromScript() {
  const scripts = document.querySelectorAll("script");

  for (const script of scripts) {
    const content = script.textContent;

    if (content.includes("accessToken")) {
      console.log("✅ accessToken 포함된 script 발견!");

      const enqueueMatch = content.match(/enqueue\("([\s\S]*?)"\);?/);
      if (enqueueMatch) {
        let rawString = enqueueMatch[1];

        try {
          const unescaped = JSON.parse(`"${rawString}"`);
        
          const parsed = JSON.parse(unescaped);

          const index = parsed.findIndex((v) => v === "accessToken");
          if (index !== -1) {
            const accessToken = parsed[index + 1];
            console.log("🎉 accessToken 추출 성공:", accessToken);
            return accessToken;
          } else {
            console.log("😵 accessToken 키 못 찾았음");
          }
        } catch (e) {
          console.log("💥 더블 파싱 실패:", e);
        }
      } else {
        console.log("❌ enqueue(...) 문자열 못 찾음");
      }
    }
  }
  console.log("❌ No accessToken found.");
  return null;
}

function addControlButtons() {
	if (document.getElementById("gpt-delete-controls")) return;

	const container = document.createElement("div");
	container.id = "gpt-delete-controls";
	container.style.display = "flex";
	container.style.flexDirection = "column";
	container.style.gap = "8px";
	container.style.margin = "12px 12px 4px 12px";
	container.style.padding = "8px";
	container.style.background = "#f0f0f0";
	container.style.borderRadius = "8px";
	container.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";

	const selectAllBtn = document.createElement("button");
	selectAllBtn.innerText = "Select All";
	selectAllBtn.onclick = () => {
		window.chatRemoverAllSelected = !window.chatRemoverAllSelected;

		document.querySelectorAll('nav a[href^="/c/"] input[type="checkbox"]').forEach(cb => {
			cb.checked = window.chatRemoverAllSelected;
		});

		selectAllBtn.innerText = window.chatRemoverAllSelected ? "Deselect All" : "Select All";
	};

	const deleteBtn = document.createElement("button");
	deleteBtn.innerText = "Delete Selected";
	deleteBtn.onclick = () => {
		const ids = [];
		const items = document.querySelectorAll('nav a[href^="/c/"]');

		for (const item of items) {
			const checkbox = item.querySelector("input[type='checkbox']");
			if (checkbox && checkbox.checked) {
				const href = item.getAttribute("href");
				const id = href.split("/c/")[1];
				if (id) {
					ids.push(id);
					item.remove();
				}
			}
		}

		if (ids.length > 0) {
			const token = extractAccessTokenFromScript();
			if (!token) {
				console.error("❌ 토큰 못 가져옴");
				return;
			}
		
			chrome.runtime.sendMessage({
        type: "delete_conversations",
        ids,
        token,
      }, (response) => {
        if (response.success) {
          console.log("✅ success");
          window.location.href = "https://chatgpt.com";
        } else {
          console.error("❌ fail");
        }
      });
    }
	};

	[selectAllBtn, deleteBtn].forEach(btn => {
		btn.style.padding = "8px";
		btn.style.fontSize = "14px";
		btn.style.fontWeight = "600";
		btn.style.border = "1px solid #ccc";
		btn.style.borderRadius = "6px";
		btn.style.cursor = "pointer";
		btn.style.transition = "all 0.2s ease";
	});

	selectAllBtn.style.backgroundColor = "#ffffff";
	selectAllBtn.onmouseover = () => {
		selectAllBtn.style.backgroundColor = "#10a37f";
		selectAllBtn.style.color = "#fff";
		selectAllBtn.style.borderColor = "#0d8364";
	};
	selectAllBtn.onmouseout = () => {
		selectAllBtn.style.backgroundColor = "#ffffff";
		selectAllBtn.style.color = "#000";
		selectAllBtn.style.borderColor = "#ccc";
	};

	deleteBtn.style.backgroundColor = "#ffeaea";
	deleteBtn.style.borderColor = "#e57373";
	deleteBtn.onmouseover = () => {
		deleteBtn.style.backgroundColor = "#e53935";
		deleteBtn.style.color = "#fff";
		deleteBtn.style.borderColor = "#c62828";
	};
	deleteBtn.onmouseout = () => {
		deleteBtn.style.backgroundColor = "#ffeaea";
		deleteBtn.style.color = "#000";
		deleteBtn.style.borderColor = "#e57373";
	};

	const sidebar = document.querySelector("nav");
	if (sidebar) {
		sidebar.prepend(container);
		container.appendChild(selectAllBtn);
		container.appendChild(deleteBtn);
	}
}

function addCheckboxesToChats() {
	const chatItems = document.querySelectorAll('nav a[href^="/c/"]');

	chatItems.forEach((item) => {
		if (item.querySelector("input[type='checkbox']")) return;

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.style.marginRight = "8px";
		checkbox.addEventListener("click", (e) => e.stopPropagation());

		item.prepend(checkbox);
	});
}

if (!window.chatRemoverObserverInitialized) {
	window.chatRemoverObserverInitialized = true;

	const observer = new MutationObserver(() => {
		addCheckboxesToChats();
		addControlButtons();
	});

	observer.observe(document.body, { childList: true, subtree: true });
}
