chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "delete_conversations") {
    const { ids, token } = message;

    Promise.all(
      ids.map((id) =>
        fetch(`https://chatgpt.com/backend-api/conversation/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ is_visible: false }),
        })
      )
    )
      .then((results) => {
        const allSuccess = results.every((res) => res.ok);
        sendResponse({ success: allSuccess });
      })
      .catch((err) => {
        console.error("❌ Fetch error", err);
        sendResponse({ success: false });
      });

    return true;
  }
});
