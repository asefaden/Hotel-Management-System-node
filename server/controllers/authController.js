const { pool } = require('../index');  // Import the connection pool from index.js
const { hashPassword, comparePassword } = require('../helpers/auth')
const jwt = require('jsonwebtoken');

const test = (req, res) => {
  res.json('test is working');
};
//Register Endpoint
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email is missing or empty
    if (!email) {
      return res.json({
        error: 'Email is required',
      });
    }

    // Check if name was entered
    if (!name) {
      return res.json({
        error: 'Name is required',
      });
    }

    // Check if password is good
    if (!password || password.length < 6) {
      return res.json({
        error: 'Password is required and should be at least 6 characters long',
      });
    }

    // Check email
    const [rows, fields] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length > 0) {
      return res.json({
        error: 'Email is taken already',
      });
    }

    const hashedPassword = await hashPassword(password)
    // Insert a new user into the MySQL database
    await pool.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

    return res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

//Login Endpoint
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const [rows, fields] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.json({
        error: 'No user found',
      });
    }

    const user = rows[0]; // Assuming the first row is the user

    // Compare the provided password with the stored hashed password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({
        error: 'Incorrect password',
      });
    }

    const { password: userPassword, ...otherDetails } = user;

    jwt.sign({ email: user.email, id: user.id, name: user.name, isAdmin: !!user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Login failed' });
      }

      res.cookie('token', token, { httpOnly: true }).json({ ...otherDetails });
    });
  } catch (err) {
    next(err);
  }
};

const getProfile = (req, res) => {
const {token} = req.cookies
if(token){
  jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
    if(err) return res.json(null);
    res.json(user)
  })
} else {
  res.json(null)
}
}

const logout = (req, res) => {
  res.clearCookie('token').json({ success: true, message: 'User logged out successfully' });
};

const createHotel = async (req, res, next) => {
  try {
    const { name, type, city, address, distance, photos, title, desc, rating, cheapestPrice, featured } = req.body;

    // Convert featured to 0 or 1
    const featuredValue = featured === 'true' || featured === true ? 1 : 0;

    // Check for undefined values and convert photos to JSON
    const params = [
      name || null,
      type || null,
      city || null,
      address || null,
      distance || null,
      photos ? JSON.stringify(photos) : null,
      title || null,
      desc || null,
      rating || null,
      cheapestPrice || null,
      featuredValue
    ];

    await pool.execute(
      'INSERT INTO hotels (name, type, city, address, distance, photos, title, `desc`, rating, cheapestPrice, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      params
    );

    res.status(200).json({ success: true, message: 'Hotel added successfully.' });
  } catch (err) {
    next(err);
  }
};



const updateHotel = async (req, res, next) => {
  const { name, city, address, cheapestPrice, type } = req.body;
  const hotelId = req.params.id;
  try {
    await pool.query(
      'UPDATE hotels SET name = ?, city = ?, address = ?, cheapestPrice = ?, type = ? WHERE id = ?',
      [name, city, address, cheapestPrice, type, hotelId]
    );
    res.status(200).json({ message: 'Hotel updated successfully' });
  } catch (err) {
    next(err);
  }
};

const deleteHotel = async (req, res, next) => {
  const hotelId = req.params.id;
  try {
    // Delete from 'unavailableDates' table
    await pool.query('DELETE FROM unavailableDates WHERE roomNumber_id IN (SELECT rn.id FROM roomNumbers rn JOIN rooms r ON rn.room_id = r.id WHERE r.hotel_id = ?)', [hotelId]);

    // Delete from 'roomNumbers' table
    await pool.query('DELETE FROM roomNumbers WHERE room_id IN (SELECT id FROM rooms WHERE hotel_id = ?)', [hotelId]);

    // Delete from 'rooms' table
    await pool.query('DELETE FROM rooms WHERE hotel_id = ?', [hotelId]);

    // Delete from 'hotels' table
    await pool.query('DELETE FROM hotels WHERE id = ?', [hotelId]);

    res.status(200).json({ message: 'Hotel deleted successfully' });
  } catch (err) {
    next(err);
  }
};


const getHotel = async (req, res, next) => {
  const hotelId = req.params.id;
  try {
    const [hotel] = await pool.query('SELECT * FROM hotels WHERE id = ?', [hotelId]);
    res.status(200).json(hotel[0] || null);
  } catch (err) {
    next(err);
  }
};

const getHotels = async (req, res, next) => {
  const { min, max, city, limit, ...others } = req.query;
  let query = 'SELECT * FROM hotels WHERE 1 = 1';
  const queryParams = [];

  if (city) {
    query += ' AND city = ?';
    queryParams.push(city);
  }

  if (min) {
    query += ' AND cheapestPrice >= ?';
    queryParams.push(parseInt(min));
  }

  if (max) {
    query += ' AND cheapestPrice <= ?';
    queryParams.push(parseInt(max));
  }

  query += ` LIMIT ${parseInt(limit) || 100}`;

  try {
    const [hotels] = await pool.query(query, queryParams);
    res.status(200).json(hotels);
  } catch (err) {
    next(err);
  }
};



const countByCity = async (req, res, next) => {
  try {
    const cities = req.query.cities ? req.query.cities.split(',') : [];
    if (cities.length === 0) return res.status(200).json([]);
    const [results] = await pool.query(
      'SELECT city, COUNT(*) AS count FROM hotels WHERE city IN (?) GROUP BY city',
      [cities]
    );
    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};

const countByType = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT type, COUNT(*) AS count FROM hotels GROUP BY type'
    );
    
    const types = ['hotel', 'apartment', 'resort', 'villa', 'cabin'];
    const result = types.map(type => {
      const row = rows.find(r => r.type === type);
      return { type: type + 's', count: row ? row.count : 0 };
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getHotelRooms = async (req, res, next) => {
  try {
    const hotelId = req.params.id;

    const [list] = await pool.query('SELECT * FROM rooms WHERE hotel_id = (?)', [hotelId]);

    // Fetch roomNumbers data for each room
    const roomsWithRoomNumbers = await Promise.all(
      list.map(async (room) => {
        const [roomNumbersData] = await pool.query('SELECT * FROM roomNumbers WHERE room_id = (?)', [room.id]);

        // Fetch unavailableDates data for each roomNumber
        const roomNumbersWithUnavailableDates = await Promise.all(
          roomNumbersData.map(async (roomNumber) => {
            const [unavailableDatesData] = await pool.query('SELECT * FROM unavailableDates WHERE roomNumber_id = (?)', [roomNumber.id]);
            return { ...roomNumber, unavailableDates: unavailableDatesData };
          })
        );

        return { ...room, roomNumbers: roomNumbersWithUnavailableDates };
      })
    );

    res.status(200).json(roomsWithRoomNumbers);
  } catch (err) {
    next(err);
  }
};




const createRoom = async (req, res, next) => {
  const hotelId = req.params.hotelid;
  const { title, price, maxPeople, desc, roomNumbers } = req.body;

  try {
    // Insert the new room into the 'rooms' table
    const [insertRoomResult] = await pool.execute(
      'INSERT INTO rooms (hotel_id, title, price, maxPeople, description) VALUES (?, ?, ?, ?, ?)',
      [hotelId, title, price, maxPeople, desc]
    );

    const roomId = insertRoomResult.insertId;

    // Insert room numbers into the 'roomNumbers' table
    const insertRoomNumbersPromises = roomNumbers.map(async (roomNumber) => {
      await pool.execute(
        'INSERT INTO roomNumbers (room_id, number) VALUES (?, ?)',
        [roomId, roomNumber.number]
      );
    });

    // Wait for all room numbers to be inserted
    await Promise.all(insertRoomNumbersPromises);

    res.status(200).json({ success: true, message: 'Room added successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add room.' });
  }
};


const updateRoomAvailability = async (req, res, next) => {
  const roomId = req.params.id;
  const roomNumberId = req.params.roomNumber;
  const timestamps = req.body.dates;

  // Ensure that timestamps is an array
  if (!Array.isArray(timestamps)) {
    return res.status(400).json({ error: 'Dates should be an array of timestamps' });
  }

  try {
    // Iterate through timestamps and insert into the unavailableDates table
    await Promise.all(timestamps.map(async (timestamp) => {
      const date = new Date(timestamp);

      // Use the userId from the verified token
      const userId = req.user.id;

      // Insert into the unavailableDates table
      await pool.query('INSERT INTO unavailableDates (roomNumber_id, date, user_id) VALUES (?, ?, ?)', [roomNumberId, date, userId]);
    }));

    // Update the roomNumbers table with the new unavailableDates
    await pool.query('UPDATE roomNumbers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [roomNumberId]);

    res.status(200).json('Room status has been updated.');
  } catch (err) {
    console.error(err);
    next(err);
  }
};


const updateRoom = async (req, res, next) => {
  const roomId = req.params.id;
  const { title, price, maxPeople, description } = req.body;

  try {
    await pool.query(
      'UPDATE rooms SET title = ?, price = ?, maxPeople = ?, description = ? WHERE id = ?',
      [title, price, maxPeople, description, roomId]
    );

    const [selectedRoom] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);

    res.status(200).json(selectedRoom[0]);
  } catch (err) {
    next(err);
  }
};

const deleteRoom = async (req, res, next) => {
  const roomId = req.params.id;

  try {
    // Delete from 'unavailableDates' table
    await pool.query('DELETE FROM unavailableDates WHERE roomNumber_id IN (SELECT id FROM roomNumbers WHERE room_id = ?)', [roomId]);

    // Delete from 'roomNumbers' table
    await pool.query('DELETE FROM roomNumbers WHERE room_id = ?', [roomId]);

    // Delete from 'rooms' table
    await pool.query('DELETE FROM rooms WHERE id = ?', [roomId]);

    res.status(200).json('Room has been deleted.');
  } catch (err) {
    next(err);
  }
};
  

const getRoom = async (req, res, next) => {
  const roomId = req.params.id;
  try {
    const [selectedRoom] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
    res.status(200).json(selectedRoom[0]);
  } catch (err) {
    next(err);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const [rows, fields] = await pool.execute('SELECT * FROM admin_users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.json({
        error: 'No user found',
      });
    }

    const user = rows[0]; // Assuming the first row is the user

    // Compare the provided password with the stored hashed password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({
        error: 'Incorrect password',
      });
    }

    const { password: adminPassword, ...otherDetails } = user;

    jwt.sign({ email: user.email, id: user.id, name: user.name, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Login failed' });
      }

      res.cookie('token', token, { httpOnly: true }).json({ ...otherDetails });
    });
  } catch (err) {
    next(err);
  }
}; 

const adminRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email is missing or empty
    if (!email) {
      return res.json({
        error: 'Email is required',
      });
    }

    // Check if name was entered
    if (!name) {
      return res.json({
        error: 'Name is required',
      });
    }

    // Check if password is good
    if (!password || password.length < 6) {
      return res.json({
        error: 'Password is required and should be at least 6 characters long',
      });
    }

    // Check email
    const [rows, fields] = await pool.execute('SELECT * FROM admin_users WHERE email = ?', [email]);

    if (rows.length > 0) {
      return res.json({
        error: 'Email is taken already',
      });
    }

    const hashedPassword = await hashPassword(password)
    // Insert a new user into the MySQL database
    await pool.execute('INSERT INTO admin_users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

    return res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

const reserved = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.execute(`
    SELECT
    hotels.name AS hotel_name,
    hotels.title AS hotel_title,
    hotels.type AS hotel_type,
    hotels.city AS hotel_city,
    hotels.address AS hotel_address,
    hotels.photos AS hotel_photos,
    hotels.desc AS hotels_desc,
    hotels.rating AS hotels_rating,
    rooms.title AS rooms_title,
    rooms.price AS rooms_price,
    rooms.maxPeople AS rooms_maxpeople,
    rooms.description AS rooms_description,
    roomNumbers.number AS rooms_number,
    unavailableDates.date AS booked_date,
    hotels.id AS hotel_id,
    rooms.id AS rooms_id,
    roomNumbers.id AS roomNumbers_id,
    unavailableDates.id AS unavailableDates_id
FROM users
JOIN unavailableDates ON users.id = unavailableDates.user_id
JOIN roomNumbers ON unavailableDates.roomNumber_id = roomNumbers.id
JOIN rooms ON roomNumbers.room_id = rooms.id
JOIN hotels ON rooms.hotel_id = hotels.id 
WHERE users.id = (?);
`, [userId]);

    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

const delReserved = async (req, res, next) => {
  try {
    const { unavailId } = req.body;
    const userId = req.user.id;

    // Ensure user can only delete their own reservation
    const [rows] = await pool.execute('DELETE FROM unavailableDates WHERE id = ? AND user_id = ?', [unavailId, userId]);

    if (rows.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation Failed: Reservation not found or unauthorized',
      });
    }

    return res.json({ success: true, message: 'Successfully Canceled' });
  } catch (err) {
    next(err);
  }
};

const getRoomByHotel = async (req, res, next) => {
  const roomId = req.params.id;

  try {
    const [selectedRoom] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
    res.status(200).json(selectedRoom[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  test,
  registerUser,
  loginUser,
  getProfile,
  logout,
  countByCity,
    countByType,
    createHotel,
    deleteHotel,
    getHotel,
    getHotelRooms,
    getHotels,
    updateHotel,
    createRoom,
  deleteRoom,
  getRoom,
  updateRoom,
  updateRoomAvailability,
  adminLogin,
  adminRegister,
  reserved,
  delReserved,
  getRoomByHotel
};
