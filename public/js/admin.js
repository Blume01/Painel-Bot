function openEditModal(id, username, role) {
  openModal('modalEdit');

  document.getElementById('user_id').value = id;
  document.getElementById('editUsername').value = username;
  document.getElementById('editRole').value = role;
}

let userLet;

async function getTableData() {
  try {
    const response = await fetch('/get-users');
    const users = await response.json();

    const tableBody = document.querySelector('#table-body');

    if (users.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='7' class='text-center py-4'>No users found.</td></tr>";
    }

    if (JSON.stringify(users) != userLet) {
      userLet = JSON.stringify(users);

      tableBody.innerHTML = '';

      users.forEach(user => {
        const row = document.createElement('tr');

        row.innerHTML = `
          <td class="px-4 py-2 font-bold">
            <div class="flex justify-center">
              ${user.id}
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
              ${user.username}
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
              ${user.role}
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
              ${new Date(user.created_at).toLocaleString('pt-BR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex justify-center">
                <button type="button" onclick="deleteUser('${user.id}')" class="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-1">
                  <i class="fas fa-trash"></i>
                </button>
                <button onclick="openEditModal('${user.id}', '${user.username}', '${user.role}')" class="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
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

document.querySelector('#addUserForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const username = document.querySelector('#username').value;
  const password = document.querySelector('#password').value;
  const role = document.querySelector('#role').value;

  try {
    const response = await fetch('/add-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        role
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

async function deleteUser(id) {
  Swal.fire({
    title: 'Are you sure you want to delete this user?',
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
        const response = await fetch(`/delete-user/${id}`, {
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

document.querySelector('#editUserForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const user_id = document.querySelector('#user_id').value;
  const editUsername = document.querySelector('#editUsername').value;
  const editPassword = document.querySelector('#editPassword').value;
  const editRole = document.querySelector('#editRole').value;

  try {
    const response = await fetch(`/edit-user/${user_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        editUsername,
        editPassword,
        editRole
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