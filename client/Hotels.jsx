import "./hotels.css";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import MailList from "../components/MailList";
import Footer from "../components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleArrowLeft,
  faCircleArrowRight,
  faCircleXmark,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useState } from "react";
import useFetch from "../components/hooks/useFetch";
import { useLocation, useNavigate } from "react-router-dom";
import { SearchContext } from "../context/SearchContext";
import { UserContext } from "../context/userContext";
import Reserve from "../components/Reserve";

const Hotel = () => {
  const location = useLocation();
  const id = location.pathname.split("/")[2];
  const [slideNumber, setSlideNumber] = useState(0);
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const { data, loading, error } = useFetch(`/hotels/find/${id}`);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const { dates, setDates, options, setOptions } = useContext(SearchContext);

  const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
  function dayDifference(date1, date2) {
    if (date1 && date2) {
      const timeDiff = Math.abs(date2.getTime() - date1.getTime());
      const diffDays = Math.ceil(timeDiff / MILLISECONDS_PER_DAY);
      return diffDays;
    }
    // Handle the case when dates are undefined or null
    return 0; // or any appropriate default value
  }
  

  const days = dayDifference(dates[0]?.endDate, dates[0]?.startDate);

  const handleOpen = (i) => {
    setSlideNumber(i);
    setOpen(true);
  };

  const handleMove = (direction) => {
    let newSlideNumber;

    if (direction === "l") {
      newSlideNumber = slideNumber === 0 ? data.photos.length - 1 : slideNumber - 1; // Dynamic length
    } else {
      newSlideNumber = slideNumber === data.photos.length - 1 ? 0 : slideNumber + 1; // Dynamic length
    }

    setSlideNumber(newSlideNumber);
  };

  const handleClick = () => {
    if (user) {
      setOpenModal(true);
    } else {
      navigate("/login");
    }
  };
  return (
    <div>
      <Navbar />
      <Header type="list" />
        {loading || !data ? (
          "loading"
        ) : (
          <div className="hotelContainer">
            {open && (
  <div className="slider">
    <FontAwesomeIcon
      icon={faCircleXmark}
      className="close"
      onClick={() => setOpen(false)}
    />
    <FontAwesomeIcon
      icon={faCircleArrowLeft}
      className="arrow"
      onClick={() => handleMove("l")}
    />
    <div className="sliderWrapper">
      <img
        src={data.photos[slideNumber % data.photos.length]}
        alt=""
        className="sliderImg"
      />
    </div>
    <FontAwesomeIcon
      icon={faCircleArrowRight}
      className="arrow"
      onClick={() => handleMove("r")}
    />
  </div>
)}

            <div className="hotelWrapper">
              <button className="bookNow" onClick={handleClick}>Reserve or Book Now!</button>
              <h1 className="hotelTitle">{data.name}</h1>
              <div className="hotelAddress">
                <FontAwesomeIcon icon={faLocationDot} />
                <span>{data.address}</span>
              </div>
              <span className="hotelDistance">
                Excellent location – {data.distance} from center
              </span>
              <span className="hotelPriceHighlight">
                Book a stay over ₹{data.cheapestPrice} at this property and get a
                free airport taxi
              </span>
              <div className="hotelImages">
  {data.photos?.map((photo, i) => (
    <div className="hotelImgWrapper" key={i}>
      <div className="image-container">
      <img
        onClick={() => handleOpen(i)}
        src={photo}
        alt=""
        className="image"
      />
      </div>
    </div>
  ))}
</div>


              <div className="hotelDetails">
                <div className="hotelDetailsTexts">
                  <h1 className="hotelTitle">{data.title}</h1>
                  <p className="hotelDesc">{data.desc}</p>
                </div>
                <div className="hotelDetailsPrice">
              <h1>Perfect for a {days}-night stay!</h1> 
                  <span>
                    Located in the real heart of {data.city}, this property has an
                    excellent location score of {data.rating}!
                  </span>
                  <h2>
                  {days==0? (
          <b>₹{data.cheapestPrice* options.room/2}</b>
        ) : (
                    <b>₹{days * data.cheapestPrice * options.room}</b>)} ({days}{" "}
                    nights)
                  </h2>
                  <button onClick={handleClick}>Reserve or Book Now!</button>
                </div>
              </div>
            </div>
            <MailList />
            <Footer />
          </div>        
      )}
      {openModal && <Reserve setOpen={setOpenModal} hotelId={id}/>}
    </div>
  );
};

export default Hotel;