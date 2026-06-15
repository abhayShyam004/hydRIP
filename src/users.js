export const USERS = [
  { name: 'Abhay', role: 'Tour Guide', diet: 'non-veg', persona: '', color: '#C1440E' },
  { name: 'Aswin', role: 'Traveller', diet: 'non-veg', persona: 'pneumonia patient', color: '#D4861A', image: '/aswin.png' },
  { name: 'Bala', role: 'Traveller', diet: 'non-veg', persona: '', color: '#5C8C6A', image: '/bala.png' },
  { name: 'Alwin', role: 'Traveller', diet: 'non-veg', persona: '', color: '#7B6147', image: '/Alwin.png' },
  { name: 'Kashi', role: 'Traveller', diet: 'veg', persona: '', color: '#3B7A8A', image: '/kashi.png' },
]

export function getUser(name) {
  return USERS.find((user) => user.name === name) || USERS[0]
}
