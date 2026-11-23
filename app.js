for (const input of document.querySelectorAll('input[type="search"]')) {
  const panel = input.closest(".panel");
  const rows = Array.from(panel.querySelectorAll(".row"));
  const status = panel.querySelector(".status");
  function filter() {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    for (const row of rows) {
      const text = row.querySelector(".caption").textContent + " " + row.dataset.channel;
      row.hidden = !text.toLowerCase().includes(query);
      if (!row.hidden) visible++;
    }
    status.textContent = visible ? `显示 ${visible} / ${rows.length} 条记录` : "没有匹配的记录";
  }
  input.hidden = false;
  input.addEventListener("input", filter);
  filter();
}
