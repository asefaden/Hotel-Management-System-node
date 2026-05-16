const express = require('express');
const router = express.Router();
const { test,
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
getRoomByHotel} = require('../controllers/authController')
const { verifyAdmin, verifyToken, verifyUser } = require('../utils/verifyToken');

//middleware

router.get('/', test)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/profile', getProfile)
router.get('/logout', logout)
router.post('/hotels/new', verifyAdmin, createHotel);
  
  // UPDATE
  router.put('/hotels/:id', verifyAdmin, updateHotel);
  
  // DELETE
  router.delete('/hotels/:id', verifyAdmin, deleteHotel);
  
  // GET
  router.get('/hotels/find/:id', getHotel);
  
  // GET ALL
  router.get('/hotels/', getHotels);
  router.get('/hotels/countByCity', countByCity);
  router.get('/hotels/countByType', countByType);
  router.get('/hotels/room/:id', getHotelRooms);
  router.post("/room/:hotelid", verifyAdmin, createRoom);

//UPDATE
router.put("/room/availability/:id/:roomNumber", verifyToken, updateRoomAvailability);
router.put("/room/:id", verifyAdmin, updateRoom);
//DELETE
router.delete("/room/:id", verifyAdmin, deleteRoom);
//GET

router.get("/room/:id", getRoom);
//GET ALL

router.post("/admin/login", adminLogin);
router.post("/admin/register", adminRegister);
router.get('/reserved/:id', verifyUser, reserved);
router.post('/delreserve', verifyToken, delReserved);
router.get('/room/:id/:hotelid', getRoomByHotel)
module.exports = router