document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Current Participants (${details.participants.length}/${details.max_participants})</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        // Populate participants as DOM elements so we can attach delete handlers
        const ul = activityCard.querySelector('.participants-list');
        if (details.participants.length === 0) {
          const li = document.createElement('li');
          li.innerHTML = '<em>No participants yet</em>';
          ul.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.textContent = p;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'delete-participant';
            btn.title = 'Unregister participant';
            btn.dataset.activity = name;
            btn.dataset.email = p;
            btn.innerHTML = '🗑️';

            btn.addEventListener('click', async () => {
              const confirmed = window.confirm(`Unregister ${p} from ${name}?`);
              if (!confirmed) return;
              await unregisterParticipant(name, p);
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
        messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Unregister a participant from an activity
  async function unregisterParticipant(activity, email) {
    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );

      const result = await resp.json();

      if (resp.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'message success';
        // Refresh activities list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister';
        messageDiv.className = 'message error';
      }
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    } catch (err) {
      console.error('Error unregistering participant:', err);
      messageDiv.textContent = 'Failed to unregister. Please try again.';
      messageDiv.className = 'message error';
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    }
  }

  // Initialize app
  fetchActivities();
});
