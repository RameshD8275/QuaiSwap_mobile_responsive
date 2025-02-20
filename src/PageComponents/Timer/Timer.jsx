import React, { useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";
function Timer() {
  const [timerHours, setTimerHours] = useState("00");
  const [timerMinutes, setTimerMinutes] = useState("00");
  const [timerSeconds, setTimerSeconds] = useState("00");
  let interval = useRef();
  const startTimer = () => {
    let end = new Date("2/15/2022 3:00 PM");
    interval = setInterval(() => {
      let _second = 1000;
      let _minute = _second * 60;
      let _hour = _minute * 60;
      let _day = _hour * 24;
      let now = new Date();
      let nowUTC = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      );
      let distance = end - nowUTC;
      var hours = Math.floor((distance % _day) / _hour);
      var minutes = Math.floor((distance % _hour) / _minute);
      var seconds = Math.floor((distance % _minute) / _second);
      if (distance < 0) {
        clearInterval(interval.current);
        return;
      } else {
        setTimerHours(hours);
        setTimerMinutes(minutes);
        setTimerSeconds(seconds);
      }
    });
  };
  useEffect(() => {
    startTimer();
  });
  return (
    <div className={styles.timer}>
      <div className={styles.time}>
        <h1>{timerHours}</h1>
        <p>h</p>
      </div>
      <div className={styles.time}>
        <h1>{timerMinutes}</h1>
        <p>m</p>
      </div>
      <div className={styles.time}>
        <h1>{timerSeconds}</h1>
        <p>s</p>
      </div>
    </div>
  );
}

export default Timer;
