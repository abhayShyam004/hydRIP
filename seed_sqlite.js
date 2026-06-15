import Database from 'better-sqlite3'

const db = new Database('trip.sqlite')

const STOPS = [
  { id: 'stop_1', day: 1, sort_order: 1, time: '4:00 PM', name: 'Kacheguda Railway Station', location: 'Kacheguda', distance: 'Arrival point', entry_fee: 0, duration: '45 min', description: 'Arrival. Check into hotel in the Somajiguda or Necklace Road area. Book 2 rooms split between 4 people.', photo_spot: null, abhay_note: 'Somajiguda area. Central to everything. Do not cheap out on location.', alternative_name: 'FabHotel Necklace Road or Hotel Geetanjali', alternative_maps_url: null, directions_url: null, date: '2025-06-18' },
  { id: 'stop_2', day: 1, sort_order: 2, time: '5:00 PM', name: 'Nimrah Cafe and Bakery', location: 'Old City', distance: '6 km from station. 20 min Uber. Rs. 120', entry_fee: 0, duration: '20 min', description: 'The most iconic Irani chai stop in Hyderabad. Standing room only. Cash only.', photo_spot: 'Charminar framed across the road while drinking chai', abhay_note: 'Cash only. Do not argue about it. Carry Rs. 100 notes.', alternative_name: 'Cafe Niloufer', alternative_maps_url: null, directions_url: null, date: '2025-06-18' },
  { id: 'stop_3', day: 1, sort_order: 3, time: '5:20 PM', name: 'Charminar and Laad Bazaar', location: 'Old City', distance: '2 min walk from Nimrah Cafe', entry_fee: 25, duration: '60 to 70 min', description: 'Climb inside for the rooftop view over the bazaars. Walk Laad Bazaar for bangles, pearls, and attar. Visit Mecca Masjid next door.', photo_spot: 'Rooftop view of bazaars at dusk from inside Charminar', abhay_note: 'Climb inside. The stairs are narrow. Alwin will complain. Go anyway.', alternative_name: 'Walk the exterior and bazaar free', alternative_maps_url: null, directions_url: null, date: '2025-06-18' },
  { id: 'stop_4', day: 1, sort_order: 4, time: '7:00 PM', name: 'Dinner at Cafe Shadab', location: 'Old City', distance: '5 min walk from Charminar', entry_fee: 0, duration: '60 min', description: 'One of Hyderabad\'s oldest and most respected restaurants. Sit down, order heavy, and take your time.', photo_spot: null, abhay_note: 'Order haleem even if you think you are full. You are never full.', alternative_name: 'Shah Ghouse Tolichowki', alternative_maps_url: null, directions_url: null, date: '2025-06-18' },
  { id: 'stop_5', day: 1, sort_order: 5, time: '8:30 PM', name: 'Hussain Sagar Lake and Lumbini Park', location: 'Necklace Road', distance: '10 km from Shadab. 20 min Uber. Rs. 150', entry_fee: 170, duration: '90 min', description: 'Ferry ride to the Buddha statue in the middle of the lake. Laser show at 8:30 PM. Be at the gate by 8:15 PM. Entry Rs. 20 for park plus Rs. 100 for boat plus Rs. 50 for laser show.', photo_spot: 'Buddha statue from the ferry at dusk. Necklace Road lit up at night.', abhay_note: 'Laser show at 8:30 PM. Gate by 8:15. Do not miss it.', alternative_name: 'Necklace Road walk only', alternative_maps_url: null, directions_url: null, date: '2025-06-18' },
  { id: 'stop_6', day: 1, sort_order: 6, time: '10:00 PM', name: 'Eat Street Necklace Road', location: 'Necklace Road', distance: '2 min walk from Lumbini Park', entry_fee: 0, duration: '60 min', description: 'Late night street food strip overlooking Hussain Sagar. Good vibe to close Day 1.', photo_spot: 'Lakeside lights from Eat Street at night', abhay_note: 'Last stop of the night. Do not overeat. Two days of biryani ahead.', alternative_name: 'Rooftop cafe Banjara Hills', alternative_maps_url: null, directions_url: null, date: '2025-06-18' },
  { id: 'stop_7', day: 2, sort_order: 1, time: '10:00 AM', name: 'Chowmahalla Palace', location: 'Old City', distance: '6 km from hotel. 15 min Uber. Rs. 100', entry_fee: 80, duration: '90 min', description: 'Former seat of the Nizam of Hyderabad. Durbar Hall with Belgian chandeliers, Nizam\'s vintage European car collection, and royal courtyards. Closed on Fridays. June 19 is Thursday so it is open.', photo_spot: 'Durbar Hall chandeliers from below. Vintage cars in the courtyard.', abhay_note: 'Do not rush this one. The Durbar Hall chandeliers are extraordinary.', alternative_name: 'Qutb Shahi Tombs or Birla Mandir', alternative_maps_url: null, directions_url: null, date: '2025-06-19' },
  { id: 'stop_8', day: 2, sort_order: 2, time: '12:00 PM', name: 'Lunch at Bawarchi', location: 'RTC Cross Road, Chikkadapally', distance: '5 km from Chowmahalla. 15 min Uber. Rs. 90', entry_fee: 0, duration: '60 min', description: 'The original Bawarchi on RTC Cross Road. No branches. Perfectly cooked biryani since 1978.', photo_spot: null, abhay_note: 'This is the original. No branches. Anyone who says otherwise is wrong.', alternative_name: 'Cafe Bahar Basheerbagh', alternative_maps_url: null, directions_url: null, date: '2025-06-19' },
  { id: 'stop_9', day: 2, sort_order: 3, time: '2:00 PM', name: 'KBR National Park', location: 'Jubilee Hills', distance: '8 km from Bawarchi. 20 min Uber. Rs. 130', entry_fee: 0, duration: '60 min', description: 'A forest reserve inside the city. 2.4 km walking trail under full canopy. Good recovery after biryani.', photo_spot: 'Canopy trail. Dense, green, unexpectedly cinematic.', abhay_note: 'Post lunch walk through a forest inside the city. Sounds boring. It is not.', alternative_name: 'Durgam Cheruvu Secret Lake', alternative_maps_url: null, directions_url: null, date: '2025-06-19' },
  { id: 'stop_10', day: 2, sort_order: 4, time: '4:00 PM', name: 'Snack at Chutneys Banjara Hills', location: 'Banjara Hills', distance: '3 km from KBR. 10 min Uber. Rs. 80', entry_fee: 0, duration: '45 min', description: 'South Indian snack break. Best pesarattu and filter coffee in the area.', photo_spot: null, abhay_note: 'Pesarattu and filter coffee. This is mandatory.', alternative_name: 'Any cafe in Jubilee Hills', alternative_maps_url: null, directions_url: null, date: '2025-06-19' },
  { id: 'stop_11', day: 2, sort_order: 5, time: '5:30 PM', name: 'Dinner at Paradise Biryani Secunderabad', location: 'Sarojini Devi Road, Secunderabad', distance: '8 km from Banjara Hills. 20 min Uber. Rs. 130', entry_fee: 0, duration: '90 min', description: 'The original Paradise open since 1953. The final meal of the trip. Order heavy. No regrets.', photo_spot: null, abhay_note: 'Last meal. Since 1953. Go hard.', alternative_name: 'Pista House or Hotel Shadab Secunderabad', alternative_maps_url: null, directions_url: null, date: '2025-06-19' },
  { id: 'stop_12', day: 2, sort_order: 6, time: '8:30 PM', name: 'Secunderabad Railway Station', location: 'Secunderabad', distance: '2 km from Paradise. 5 min Uber. Rs. 60', entry_fee: 0, duration: 'Departure', description: 'Departure. Board the train. Trip complete.', photo_spot: null, abhay_note: null, alternative_name: null, alternative_maps_url: null, directions_url: null, date: '2025-06-19' }
]

const RESTAURANTS = [
  { id: 'rest_1', name: 'Nimrah Cafe and Bakery', meal_type: 'Evening Snack', day: 1, time: '5:00 PM', address: 'Near Charminar, Old City', distance: '6 km from station', has_cash_only_note: 1, sort_order: 1 },
  { id: 'rest_2', name: 'Cafe Shadab', meal_type: 'Dinner', day: 1, time: '7:00 PM', address: 'Near Charminar, Old City', distance: '5 min walk from Charminar', has_cash_only_note: 0, sort_order: 2 },
  { id: 'rest_3', name: 'Eat Street Necklace Road', meal_type: 'Late Night Snacks', day: 1, time: '10:00 PM', address: 'Necklace Road, Hussain Sagar', distance: '2 min walk from Lumbini Park', has_cash_only_note: 0, sort_order: 3 },
  { id: 'rest_4', name: 'Bawarchi', meal_type: 'Lunch', day: 2, time: '12:00 PM', address: 'RTC Cross Road, Chikkadapally', distance: '5 km from Chowmahalla. 15 min Uber.', has_cash_only_note: 0, sort_order: 4 },
  { id: 'rest_5', name: 'Chutneys Banjara Hills', meal_type: 'Snack', day: 2, time: '4:00 PM', address: 'Banjara Hills', distance: '3 km from KBR Park. 10 min Uber.', has_cash_only_note: 0, sort_order: 5 },
  { id: 'rest_6', name: 'Paradise Biryani Secunderabad', meal_type: 'Dinner', day: 2, time: '5:30 PM', address: 'Sarojini Devi Road, Secunderabad', distance: '8 km from Banjara Hills. 20 min Uber.', has_cash_only_note: 0, sort_order: 6 }
]

const MENU_ITEMS = [
  { id: 'menu_1_1', restaurant_id: 'rest_1', sort_order: 1, name: 'Irani Chai', price: 25, diet: 'veg' },
  { id: 'menu_1_2', restaurant_id: 'rest_1', sort_order: 2, name: 'Osmania Biscuits', price: 30, diet: 'veg' },
  { id: 'menu_1_3', restaurant_id: 'rest_1', sort_order: 3, name: 'Bun Maska', price: 50, diet: 'veg' },
  { id: 'menu_2_1', restaurant_id: 'rest_2', sort_order: 1, name: 'Mutton Biryani', price: 220, diet: 'non-veg' },
  { id: 'menu_2_2', restaurant_id: 'rest_2', sort_order: 2, name: 'Seekh Kebabs', price: 180, diet: 'non-veg' },
  { id: 'menu_2_3', restaurant_id: 'rest_2', sort_order: 3, name: 'Haleem', price: 150, diet: 'non-veg' },
  { id: 'menu_2_4', restaurant_id: 'rest_2', sort_order: 4, name: 'Veg Biryani', price: 150, diet: 'veg' },
  { id: 'menu_2_5', restaurant_id: 'rest_2', sort_order: 5, name: 'Paneer Butter Masala', price: 160, diet: 'veg' },
  { id: 'menu_2_6', restaurant_id: 'rest_2', sort_order: 6, name: 'Sheermal', price: 40, diet: 'veg' },
  { id: 'menu_2_7', restaurant_id: 'rest_2', sort_order: 7, name: 'Qubani Ka Meetha', price: 80, diet: 'veg' },
  { id: 'menu_2_8', restaurant_id: 'rest_2', sort_order: 8, name: 'Double Ka Meetha', price: 70, diet: 'veg' },
  { id: 'menu_3_1', restaurant_id: 'rest_3', sort_order: 1, name: 'Shawarma', price: 120, diet: 'non-veg' },
  { id: 'menu_3_2', restaurant_id: 'rest_3', sort_order: 2, name: 'Sweet Corn Manchurian', price: 80, diet: 'veg' },
  { id: 'menu_3_3', restaurant_id: 'rest_3', sort_order: 3, name: 'Ice Cream Rolls', price: 100, diet: 'veg' },
  { id: 'menu_3_4', restaurant_id: 'rest_3', sort_order: 4, name: 'Paneer Tikka', price: 140, diet: 'veg' },
  { id: 'menu_3_5', restaurant_id: 'rest_3', sort_order: 5, name: 'Kulfi', price: 60, diet: 'veg' },
  { id: 'menu_4_1', restaurant_id: 'rest_4', sort_order: 1, name: 'Chicken Biryani', price: 260, diet: 'non-veg' },
  { id: 'menu_4_2', restaurant_id: 'rest_4', sort_order: 2, name: 'Mutton Biryani', price: 320, diet: 'non-veg' },
  { id: 'menu_4_3', restaurant_id: 'rest_4', sort_order: 3, name: 'Chicken 65', price: 220, diet: 'non-veg' },
  { id: 'menu_4_4', restaurant_id: 'rest_4', sort_order: 4, name: 'Veg Biryani', price: 200, diet: 'veg' },
  { id: 'menu_4_5', restaurant_id: 'rest_4', sort_order: 5, name: 'Dal Makhani', price: 160, diet: 'veg' },
  { id: 'menu_4_6', restaurant_id: 'rest_4', sort_order: 6, name: 'Butter Naan', price: 40, diet: 'veg' },
  { id: 'menu_4_7', restaurant_id: 'rest_4', sort_order: 7, name: 'Lassi', price: 60, diet: 'veg' },
  { id: 'menu_5_1', restaurant_id: 'rest_5', sort_order: 1, name: 'Gongura Chicken', price: 280, diet: 'non-veg' },
  { id: 'menu_5_2', restaurant_id: 'rest_5', sort_order: 2, name: 'Pesarattu', price: 120, diet: 'veg' },
  { id: 'menu_5_3', restaurant_id: 'rest_5', sort_order: 3, name: 'Masala Dosa', price: 110, diet: 'veg' },
  { id: 'menu_5_4', restaurant_id: 'rest_5', sort_order: 4, name: 'Idli Sambar', price: 80, diet: 'veg' },
  { id: 'menu_5_5', restaurant_id: 'rest_5', sort_order: 5, name: 'Filter Coffee', price: 50, diet: 'veg' },
  { id: 'menu_6_1', restaurant_id: 'rest_6', sort_order: 1, name: 'Chicken Supreme Biryani', price: 300, diet: 'non-veg' },
  { id: 'menu_6_2', restaurant_id: 'rest_6', sort_order: 2, name: 'Mutton Biryani', price: 360, diet: 'non-veg' },
  { id: 'menu_6_3', restaurant_id: 'rest_6', sort_order: 3, name: 'Nihari', price: 200, diet: 'non-veg' },
  { id: 'menu_6_4', restaurant_id: 'rest_6', sort_order: 4, name: 'Veg Dum Biryani', price: 220, diet: 'veg' },
  { id: 'menu_6_5', restaurant_id: 'rest_6', sort_order: 5, name: 'Paneer Masala', price: 180, diet: 'veg' },
  { id: 'menu_6_6', restaurant_id: 'rest_6', sort_order: 6, name: 'Lassi Faluda', price: 80, diet: 'veg' }
]

const CHECKLIST = [
  { id: 'cl_1', category: 'Clothes', sort_order: 1, label: 'Light cotton clothes for 2 days' },
  { id: 'cl_2', category: 'Clothes', sort_order: 2, label: 'Extra footwear' },
  { id: 'cl_3', category: 'Clothes', sort_order: 3, label: 'Sunglasses' },
  { id: 'cl_4', category: 'Essentials', sort_order: 4, label: 'Sunscreen SPF 50 or higher' },
  { id: 'cl_5', category: 'Essentials', sort_order: 5, label: 'Refillable water bottle' },
  { id: 'cl_6', category: 'Essentials', sort_order: 6, label: 'Power bank' },
  { id: 'cl_7', category: 'Essentials', sort_order: 7, label: 'Earphones' },
  { id: 'cl_8', category: 'Essentials', sort_order: 8, label: 'ID proof' },
  { id: 'cl_9', category: 'Essentials', sort_order: 9, label: 'Cash minimum Rs. 2000' },
  { id: 'cl_10', category: 'Essentials', sort_order: 10, label: 'UPI apps ready' },
  { id: 'cl_11', category: 'Health', sort_order: 11, label: 'ORS packets' },
  { id: 'cl_12', category: 'Health', sort_order: 12, label: 'Paracetamol' },
  { id: 'cl_13', category: 'Health', sort_order: 13, label: 'Antacid' },
  { id: 'cl_14', category: 'Health', sort_order: 14, label: 'Hand sanitiser' },
  { id: 'cl_15', category: 'Travel', sort_order: 15, label: 'Train ticket downloaded' },
  { id: 'cl_16', category: 'Travel', sort_order: 16, label: 'Hotel booking confirmed' },
  { id: 'cl_17', category: 'Travel', sort_order: 17, label: 'Hyderabad offline map downloaded on Google Maps' },
  { id: 'cl_18', category: 'Travel', sort_order: 18, label: 'Uber app installed' }
]

const TIPS = [
  { id: 'tip_1', sort_order: 1, content: 'UPI works everywhere in Old City, even at bangle stalls in Laad Bazaar.' },
  { id: 'tip_2', sort_order: 2, content: 'Always book Uber or Ola via app. Never negotiate with auto drivers near tourist spots. They will overcharge.' },
  { id: 'tip_3', sort_order: 3, content: 'Cover shoulders at Charminar and Mecca Masjid. It is a place of worship.' },
  { id: 'tip_4', sort_order: 4, content: 'Carry Rs. 100 and Rs. 50 notes. Old City vendors struggle with large bills.' },
  { id: 'tip_5', sort_order: 5, content: 'June heat peaks between 11 AM and 4 PM. Carry a refillable water bottle and ORS packets at all times.' },
  { id: 'tip_6', sort_order: 6, content: 'At Laad Bazaar, start bargaining at 40 percent of the quoted price. Work up from there.' },
  { id: 'tip_7', sort_order: 7, content: 'Nimrah Cafe is cash only. No UPI, no card. Non-negotiable.' },
  { id: 'tip_8', sort_order: 8, content: 'Chowmahalla Palace is closed on Fridays. June 19 is Thursday. It is open.' },
  { id: 'tip_9', sort_order: 9, content: 'Paradise Biryani Secunderabad branch is 2 minutes from Secunderabad station. Perfect for the last meal before boarding.' }
]

const CONTACTS = [
  { id: 'contact_1', sort_order: 1, label: 'Police', number: '100' },
  { id: 'contact_2', sort_order: 2, label: 'Ambulance', number: '108' },
  { id: 'contact_3', sort_order: 3, label: 'Hyderabad City Helpline', number: '040-27852425' },
  { id: 'contact_4', sort_order: 4, label: 'Osmania General Hospital nearest to Old City', number: '040-24600177' }
]

const SETTINGS = [
  { key: 'countdown_target', value: '2025-06-18T16:00:00+05:30' },
  { key: 'hero_subtitle', value: 'June 18 to 19, 2025. 5 people.' },
  { key: 'weather_text', value: 'Hyderabad on June 18. 38 degrees C. Hot and Humid.' },
  { key: 'weather_sub', value: 'Carry water. Wear light cotton.' }
]

try {
  // Use transaction to insert all
  const seedTransaction = db.transaction(() => {
    
    // Check if stops is empty
    const stopsCount = db.prepare('SELECT count(*) as count FROM stops').get().count
    if (stopsCount === 0) {
      console.log('Seeding stops...')
      const insertStop = db.prepare('INSERT INTO stops (id, day, sort_order, time, name, location, distance, entry_fee, duration, description, photo_spot, abhay_note, alternative_name, alternative_maps_url, directions_url, date) VALUES (@id, @day, @sort_order, @time, @name, @location, @distance, @entry_fee, @duration, @description, @photo_spot, @abhay_note, @alternative_name, @alternative_maps_url, @directions_url, @date)')
      STOPS.forEach(stop => insertStop.run(stop))
    }

    // Check if restaurants is empty
    const restCount = db.prepare('SELECT count(*) as count FROM restaurants').get().count
    if (restCount === 0) {
      console.log('Seeding restaurants and menu items...')
      const insertRest = db.prepare('INSERT INTO restaurants (id, name, meal_type, day, time, address, distance, has_cash_only_note, sort_order) VALUES (@id, @name, @meal_type, @day, @time, @address, @distance, @has_cash_only_note, @sort_order)')
      RESTAURANTS.forEach(r => insertRest.run(r))

      // Assume menu items is empty if restaurants is empty to respect FK constraint easily
      const insertMenu = db.prepare('INSERT INTO menu_items (id, restaurant_id, sort_order, name, price, diet) VALUES (@id, @restaurant_id, @sort_order, @name, @price, @diet)')
      MENU_ITEMS.forEach(m => insertMenu.run(m))
    }

    // Check checklist
    const checklistCount = db.prepare('SELECT count(*) as count FROM checklist_definitions').get().count
    if (checklistCount === 0) {
       console.log('Seeding checklist...')
       const insertChecklist = db.prepare('INSERT INTO checklist_definitions (id, category, sort_order, label) VALUES (@id, @category, @sort_order, @label)')
       CHECKLIST.forEach(c => insertChecklist.run(c))
    }

    // Check tips
    const tipsCount = db.prepare('SELECT count(*) as count FROM trip_tips').get().count
    if (tipsCount === 0) {
       console.log('Seeding tips...')
       const insertTip = db.prepare('INSERT INTO trip_tips (id, sort_order, content) VALUES (@id, @sort_order, @content)')
       TIPS.forEach(t => insertTip.run(t))
    }

    // Check contacts
    const contactsCount = db.prepare('SELECT count(*) as count FROM emergency_contacts').get().count
    if (contactsCount === 0) {
       console.log('Seeding emergency contacts...')
       const insertContact = db.prepare('INSERT INTO emergency_contacts (id, sort_order, label, number) VALUES (@id, @sort_order, @label, @number)')
       CONTACTS.forEach(c => insertContact.run(c))
    }

    // Check settings
    const settingsCount = db.prepare('SELECT count(*) as count FROM app_settings').get().count
    if (settingsCount === 0) {
       console.log('Seeding settings...')
       const insertSetting = db.prepare('INSERT INTO app_settings (key, value) VALUES (@key, @value)')
       SETTINGS.forEach(s => insertSetting.run(s))
    }
  })

  seedTransaction()
  console.log('Seeding completed successfully.')
} catch (error) {
  console.error('Error during seeding:', error)
}
