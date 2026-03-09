// DocAvailability.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getDoctorsList,
  getDoctorAvailabilityUI,
} from "../../helper/doctorAvailabilityApi";

const MAX_DOCTORS_TO_SHOW = 12; // change to 24 if you want

const DoctorsAvailability = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [availabilityData, setAvailabilityData] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ added (for flow Doctors -> Availability -> BookAppointment)
  const navigate = useNavigate();
  const { state } = useLocation();
  const selectedDoctorId = state?.doctorId;
  const selectedDoctorName = state?.doctorName;

  // 1) Load doctors from backend once
  useEffect(() => {
    (async () => {
      try {
        const data = await getDoctorsList();
        // take first N only (performance)
        setDoctors((data.doctors || []).slice(0, MAX_DOCTORS_TO_SHOW));
      } catch (e) {
        toast.error(e.message);
      }
    })();
  }, []);

  // 2) When date changes → fetch availability for each doctor
  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);

    if (!date) {
      setAvailabilityData([]);
      return;
    }

    if (doctors.length === 0) {
      toast.error("No doctors found in database.");
      return;
    }

    try {
      setLoading(true);
      setAvailabilityData([]);

      // Fetch availability in parallel for doctors
      const results = await Promise.all(
        doctors.map(async (doc) => {
          const r = await getDoctorAvailabilityUI(doc.doctor_id, date);
          return {
            doctor_id: doc.doctor_id,
            name: doc.name,
            percentage: r.availability_percent,
            level: r.level,
            time: r.time,
            is_available: r.is_available,
            reason: r.reason,
          };
        })
      );

      // ✅ if coming from Doctors page with a specific doctor selected,
      // show that doctor first (still shows all doctors, no function change)
      const sorted = selectedDoctorId
        ? [...results].sort((a, b) => {
            const aMatch = a.doctor_id === selectedDoctorId ? 1 : 0;
            const bMatch = b.doctor_id === selectedDoctorId ? 1 : 0;
            return bMatch - aMatch;
          })
        : results;

      setAvailabilityData(sorted);
      toast.success(`Showing availability for ${date}`, { autoClose: 1500 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ added (button action)
  const handleBookAppointment = () => {
    if (!selectedDate) {
      toast.error("Please select a date first.");
      return;
    }

    // find selected doctor details (if user came from Doctors page)
    const chosen =
      selectedDoctorId &&
      availabilityData.find((d) => d.doctor_id === selectedDoctorId);

    navigate("/bookAppointment", {
      state: {
        doctorId: selectedDoctorId || chosen?.doctor_id || null,
        doctorName: selectedDoctorName || chosen?.name || "Selected Doctor",
        date: selectedDate,
      },
    });
  };

  return (
    <div
      className="min-h-screen px-4 sm:px-6 lg:px-8 pt-10 pb-14
                 bg-gradient-to-br from-blue-50 via-white to-slate-100"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Doctor Availability
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Select a date to view sessions and availability percentage.
            </p>

            {/* ✅ show selected doctor from Doctors page */}
            {selectedDoctorName && (
              <p className="text-sm text-blue-700 font-semibold mt-2">
                Selected Doctor: {selectedDoctorName}
              </p>
            )}
          </div>

          <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold">
            Showing first {MAX_DOCTORS_TO_SHOW} doctors
          </div>
        </div>

        {/* Top Row: Date Card + Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Date Selector */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Date
            </label>

            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Tip: choose a date to load sessions
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Green = high availability
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Red = low availability
              </span>
            </div>

            {/* ✅ Book Appointment button (appears after date selected) */}
            {selectedDate && (
              <button
                type="button"
                onClick={handleBookAppointment}
                className="mt-5 w-full sm:w-auto px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
              >
                Book Appointment
              </button>
            )}
          </div>

          {/* Info / Quick Guide (no function changes) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-semibold text-slate-900 mb-2">
              Quick guide
            </p>
            <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
              <li>Select a date to fetch availability.</li>
              <li>Each card shows % + session time.</li>
              <li>If unavailable, the reason will show.</li>
            </ul>

            <div className="mt-5 border-t pt-4">
              <p className="text-xs text-slate-500">
                Status updates will appear after selecting a date.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-slate-600">
            Loading availability...
          </div>
        )}

        {/* Availability Grid */}
        {availabilityData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {availabilityData.map((doc, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center bg-white shadow-sm rounded-2xl p-5 border border-slate-200 hover:shadow-md transition ${
                  selectedDoctorId && doc.doctor_id === selectedDoctorId
                    ? "ring-2 ring-blue-300"
                    : ""
                }`}
              >
                <div className="relative flex items-center justify-center w-20 h-20 mb-3">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      strokeWidth="8"
                      stroke="#E5E7EB"
                      fill="transparent"
                      r="32"
                      cx="40"
                      cy="40"
                    />
                    <circle
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke={
                        doc.percentage > 70
                          ? "#22c55e"
                          : doc.percentage > 40
                          ? "#facc15"
                          : "#ef4444"
                      }
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={
                        2 * Math.PI * 32 * (1 - doc.percentage / 100)
                      }
                      fill="transparent"
                      r="32"
                      cx="40"
                      cy="40"
                    />
                  </svg>

                  <span className="absolute text-sm font-bold text-slate-800">
                    {doc.percentage}%
                  </span>
                </div>

                <p className="text-center font-semibold text-slate-800">
                  {doc.name}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {doc.time ? doc.time : "No session"}
                </p>

                {!doc.is_available && doc.reason && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    {doc.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state (date selected but no data) */}
        {availabilityData.length === 0 && selectedDate && !loading && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-slate-700">
            <p className="font-semibold">No availability data found</p>
            <p className="text-sm text-slate-600 mt-1">
              Try selecting another date or check if doctors have sessions for
              this day.
            </p>
          </div>
        )}

        {/* Empty state (first load) */}
        {!selectedDate && !loading && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-slate-700">
            <p className="font-semibold">Select a date to begin</p>
            <p className="text-sm text-slate-600 mt-1">
              After selecting a date, availability cards will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsAvailability;