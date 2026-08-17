const healthLink = document.getElementById("health-link");

if (healthLink) {
  healthLink.addEventListener("click", (event) => {
    event.preventDefault();
    fetch("/health")
      .then((res) => res.json())
      .then((data) => {
        alert(`API status: ${data.status}\nUptime: ${Math.round(data.uptime)}s`);
      })
      .catch(() => alert("Health check failed"));
  });
}