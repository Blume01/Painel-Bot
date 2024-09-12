function openEditModal(id, name, token) {
  openModal('modalEdit');

  document.getElementById('bot_id').value = id;
  document.getElementById('editName').value = name;
  document.getElementById('editToken').value = token;
}

function toggleBot(id) {
  fetch(`/toggle-bot/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id
    }),
  });
}

let botLet;

async function getTableData() {
  try {
    const response = await fetch('/get-bots');
    const bots = await response.json();

    const tableBody = document.querySelector('#table-body');

    if (bots.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='7' class='text-center py-4'>No bots found.</td></tr>";
    }

    if (JSON.stringify(bots) != botLet) {
      botLet = JSON.stringify(bots);

      tableBody.innerHTML = '';

      bots.forEach(bot => {
        const row = document.createElement('tr');

        row.innerHTML = `
          <td class="px-4 py-2 font-bold">
            <div class="flex justify-center">
              ${bot.id}
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
              ${bot.name}
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
              <a class="text-blue-500" href="https://t.me/${bot.username}">@${bot.username}</a>
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
              ${bot.token.split(':').slice(0, 1).join(':')}...
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
              ${new Date(bot.created_at).toLocaleString('pt-BR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
              <i onclick="toggleBot('${bot.id}')" style="cursor:pointer" class="fa fa-toggle-${bot.status === 'active' ? 'on' : 'off'} fa-2x"></i>
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
                <button type="button" onclick="deleteBot('${bot.id}')" class="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-1">
                  <i class="fas fa-trash"></i>
                </button>
                <button onclick="openEditModal('${bot.id}', '${bot.name}', '${bot.token}')" class="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                  <i class="fas fa-edit"></i>
                </button>
            </div>
          </td>
        `;

        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    const tableBody = document.querySelector('#table-body');
    tableBody.innerHTML = `<tr><td colspan='7' class='text-center py-4'>Error loading data: ${error.message}</td></tr>`;
  }
}

setInterval(getTableData, 1);

document.querySelector('#addBotForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const name = document.querySelector('#name').value;
  const token = document.querySelector('#token').value;

  try {
    const response = await fetch('/add-bot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        token
      }),
    });

    const result = await response.json();

    if (response.ok) {
      closeModal('modalAdd');
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
});

async function deleteBot(id) {
  Swal.fire({
    title: 'Are you sure you want to delete this bot?',
    text: 'This process will be irreversible!',
    showDenyButton: true,
    confirmButtonText: 'Yes, proceed!',
    denyButtonText: 'No, cancel!',
    icon: 'warning',
    confirmButtonColor: '#2d3748',
    denyButtonColor: '#c53030',
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        const response = await fetch(`/delete-bot/${id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const result = await response.json();

        if (response.ok) {
          showToast(result.message, 'success');
        } else {
          showToast(result.message, 'error');
        }
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  });
}

document.querySelector('#editBotForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const id = document.querySelector('#bot_id').value;
  const editName = document.querySelector('#editName').value;
  const editToken = document.querySelector('#editToken').value;

  try {
    const response = await fetch(`/edit-bot/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        editName,
        editToken
      }),
    });

    const result = await response.json();

    if (response.ok) {
      closeModal('modalEdit');
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
});