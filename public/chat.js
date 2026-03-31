const socket = io();

const messagesList = document.getElementById('messages');
const form = document.getElementById('chat-form');
const senderInput = document.getElementById('sender');
const messageInput = document.getElementById('message');
const statusText = document.getElementById('status');
const profileNameEl = document.getElementById('profile-name');
const profileStatusEl = document.getElementById('profile-status');
const profileRoleEl = document.getElementById('profile-role');
const profileLocationEl = document.getElementById('profile-location');
const profileWordsEl = document.getElementById('profile-words');
const profileAvatarEl = document.getElementById('profile-avatar');
const editProfileBtn = document.getElementById('edit-profile');
const profileModal = document.getElementById('profile-modal');
const profileForm = document.getElementById('profile-form');
const profileModalClose = document.getElementById('profile-modal-close');
const profileCancelBtn = document.getElementById('profile-cancel');
const profileNameInput = document.getElementById('modal-name');
const profileStatusInput = document.getElementById('modal-status');
const profileRoleInput = document.getElementById('modal-role');
const profileLocationInput = document.getElementById('modal-location');

const COOKIE_NAME = 'chat_username';
const COOKIE_STATUS = 'chat_status';
const COOKIE_ROLE = 'chat_role';
const COOKIE_LOCATION = 'chat_location';

const getCookie = (name) => {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

const setCookie = (name, value, days = 30) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
};

const updateProfileUI = (name, status, role, location, words = 0) => {
  const initials = name ? name.trim().charAt(0).toUpperCase() : 'A';
  profileNameEl.textContent = name;
  profileStatusEl.textContent = status;
  profileRoleEl.textContent = role;
  profileLocationEl.textContent = location;
  profileWordsEl.textContent = `Words: ${words}`;
  profileAvatarEl.textContent = initials;
  senderInput.value = name;
};

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

let currentMessages = [];

const updateWordCount = () => {
  const currentName = getCookie(COOKIE_NAME) || 'Anonymous';
  const words = currentMessages
    .filter((message) => message.sender === currentName)
    .reduce((sum, message) => sum + countWords(message.content), 0);
  profileWordsEl.textContent = `Words: ${words}`;
};

const openProfileModal = (autoOpen = false) => {
  const currentName = getCookie(COOKIE_NAME) || 'Anonymous';
  const currentStatus = getCookie(COOKIE_STATUS) || 'Ready to chat';
  const currentRole = getCookie(COOKIE_ROLE) || 'Visitor';
  const currentLocation = getCookie(COOKIE_LOCATION) || 'Unknown';

  profileNameInput.value = currentName;
  profileStatusInput.value = currentStatus;
  profileRoleInput.value = currentRole;
  profileLocationInput.value = currentLocation;

  profileModal.classList.add('visible');
  profileModal.setAttribute('aria-hidden', 'false');
  if (autoOpen) {
    profileNameInput.focus();
  }
};

const closeProfileModal = () => {
  profileModal.classList.remove('visible');
  profileModal.setAttribute('aria-hidden', 'true');
};

const saveProfile = () => {
  const newName = profileNameInput.value.trim() || 'Anonymous';
  const newStatus = profileStatusInput.value.trim() || 'Ready to chat';
  const newRole = profileRoleInput.value.trim() || 'Visitor';
  const newLocation = profileLocationInput.value.trim() || 'Unknown';

  setCookie(COOKIE_NAME, newName);
  setCookie(COOKIE_STATUS, newStatus);
  setCookie(COOKIE_ROLE, newRole);
  setCookie(COOKIE_LOCATION, newLocation);
  updateProfileUI(newName, newStatus, newRole, newLocation);
  updateWordCount();
  closeProfileModal();
};

const initializeProfile = () => {
  const name = getCookie(COOKIE_NAME);
  const status = getCookie(COOKIE_STATUS) || 'Ready to chat';
  const role = getCookie(COOKIE_ROLE) || 'Visitor';
  const location = getCookie(COOKIE_LOCATION) || 'Unknown';

  if (!name) {
    openProfileModal(true);
  } else {
    updateProfileUI(name, status, role, location);
  }
  updateWordCount();
};

initializeProfile();

editProfileBtn.addEventListener('click', () => openProfileModal());
profileModalClose.addEventListener('click', closeProfileModal);
profileCancelBtn.addEventListener('click', closeProfileModal);
profileModal.addEventListener('click', (event) => {
  if (event.target === profileModal) {
    closeProfileModal();
  }
});
profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveProfile();
});

const formatDate = (value) => new Date(value).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
});

const appendMessage = (data, self = false) => {
  const item = document.createElement('div');
  item.className = `message${self ? ' self' : ''}`;
  item.innerHTML = `
    <strong>${data.sender}</strong>
    <div>${data.content}</div>
    <time>${formatDate(data.timestamp)}</time>
  `;
  messagesList.appendChild(item);
  messagesList.scrollTop = messagesList.scrollHeight;
};


const loadMessages = async () => {
  try {
    const response = await fetch('/api/chat/messages');
    if (!response.ok) throw new Error('Unable to load messages');
    const messages = await response.json();
    currentMessages = messages;
    messagesList.innerHTML = '';
    messages.forEach((message) => appendMessage(message, false));
    updateWordCount();
  } catch (error) {
    statusText.textContent = 'Unable to load message history.';
  }
};

const sendMessage = async (messageData) => {
  try {
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    if (!response.ok) throw new Error('Failed to send message');
    const savedMessage = await response.json();
    messageInput.value = '';
    socket.emit('chatMessage', savedMessage);
    await loadMessages();
  } catch (error) {
    statusText.textContent = 'Failed to send message. Try again.';
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const sender = senderInput.value.trim() || getCookie(COOKIE_NAME) || 'Anonymous';
  setCookie(COOKIE_NAME, sender);

  const content = messageInput.value.trim();
  if (!content) return;

  await sendMessage({ sender, content });
  messageInput.value = '';
});

socket.on('connect', () => {
  statusText.textContent = 'Connected to live chat.';
});

socket.on('disconnect', () => {
  statusText.textContent = 'Disconnected. Reconnect to continue.';
});

socket.on('chatMessage', () => {
  loadMessages();
});

loadMessages();