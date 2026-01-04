import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState("si"); // default Sinhala

  const text = {
    si: {
      welcome: "ඔබව සාදරයෙන් පිළිගනිමු",
      healthAlerts: "සෞඛ්‍ය දැනුම්දීම්",
      washHands: "අත් නිතර සෝදන්න",
      wearMask: "මස්ක් භාවිතා කරන්න",
      fever: "උණ / කැස්ස ඇත්නම් දැනුම් දෙන්න",
      doctorsToday: "අද ලබා ගත හැකි වෛද්‍යවරු",
      checkAvailability: "වෛද්‍ය ලබාගත හැකිද පරීක්ෂා කරන්න",
      opdInfo: "OPD තොරතුරු (ශ්‍රී ලංකා)",
      opdTime: "සාමාන්‍ය OPD වේලාව",
      opdEmergency: "හදිසි ප්‍රතිකාර 24x7 ලබා ගත හැක",
      opdDays: "සඳුදා – සිකුරාදා",
      opdHours: "පෙ.ව. 8.00 – ම.ද. 12.00",
    },
    ta: {
      welcome: "வரவேற்கிறோம்",
      healthAlerts: "சுகாதார அறிவுறுத்தல்கள்",
      washHands: "கைகளை அடிக்கடி கழுவவும்",
      wearMask: "மாஸ்க் அணியவும்",
      fever: "காய்ச்சல் / இருமல் இருந்தால் தெரிவிக்கவும்",
      doctorsToday: "இன்றைய மருத்துவர்கள்",
      checkAvailability: "மருத்துவர் கிடைப்பை சரிபார்க்கவும்",
      opdInfo: "OPD தகவல் (இலங்கை)",
      opdTime: "சாதாரண OPD நேரம்",
      opdEmergency: "அவசர சிகிச்சை 24x7",
      opdDays: "திங்கள் – வெள்ளி",
      opdHours: "காலை 8.00 – மதியம் 12.00",
    },
    en: {
      welcome: "Welcome",
      healthAlerts: "Health Alerts",
      washHands: "Wash hands frequently",
      wearMask: "Wear a face mask",
      fever: "Inform staff if you have fever or cough",
      doctorsToday: "Doctors Available Today",
      checkAvailability: "Check Doctor Availability",
      opdInfo: "OPD Information (Sri Lanka)",
      opdTime: "General OPD Time",
      opdEmergency: "Emergency services available 24x7",
      opdDays: "Monday – Friday",
      opdHours: "8.00 AM – 12.00 PM",
    },
  };

  const t = text[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">

      {/* Language Dropdown */}
      <div className="flex justify-end mb-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 border rounded-lg shadow-sm"
        >
          <option value="si">සිංහල</option>
          <option value="ta">தமிழ்</option>
          <option value="en">English</option>
        </select>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🏥 {t.welcome}
      </h1>

      {/* Main Layout 3:1 */}
      <div className="grid grid-cols-4 gap-6">

        {/* LEFT SIDE (3 columns) */}
        <div className="col-span-3 space-y-6">

          {/* Health Alerts */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              🚨 {t.healthAlerts}
            </h2>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-red-50 rounded-lg">
                🦠
                <p className="mt-2">{t.wearMask}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                🧼
                <p className="mt-2">{t.washHands}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                🤒
                <p className="mt-2">{t.fever}</p>
              </div>
            </div>
          </div>

          {/* OPD Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🏥 OPD Status</h2>
            <div className="flex gap-6 text-lg">
              <span>🟢 OPD Open</span>
              <span>🟡 High Crowd</span>
              <span>🔴 Clinic Closed</span>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE (1 column) */}
        <div className="space-y-6">

          {/* Doctors Available Today */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              👨‍⚕️ {t.doctorsToday}
            </h2>

            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded">
                🟢 Dr. Perera <br />
                General OPD <br />
                ⏰ 8.00 AM – 12.00 PM
              </div>

              <div className="p-3 bg-green-50 rounded">
                🟢 Dr. Silva <br />
                Medical Clinic <br />
                ⏰ 9.00 AM – 1.00 PM
              </div>
            </div>

            <button
              onClick={() => navigate("/doctor-availability")}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              🩺 {t.checkAvailability}
            </button>
          </div>

          {/* OPD Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              📌 {t.opdInfo}
            </h2>

            <p className="mb-2 font-medium">{t.opdTime}</p>
            <ul className="list-disc ml-5 text-sm">
              <li>{t.opdDays}</li>
              <li>{t.opdHours}</li>
            </ul>

            <p className="mt-3 text-sm">
              🚑 {t.opdEmergency}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserDashboard;