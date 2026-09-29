import {useEffect, useState} from "react";
import { BASE_URL } from "../config";

export default function useCineCircleRatings(movieIds) {
  const [ratings, setRatings] = useState({});
  const key = movieIds.filter(Boolean).join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`${BASE_URL}/reviews/averages?ids=${key}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (!cancelled) setRatings(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [key]);

  return ratings; 
}