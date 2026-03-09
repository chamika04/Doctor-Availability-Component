const FLASK_BASE_URL = "http://localhost:5001";

export async function getDoctorsList({ search = "", specialty = "All" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (specialty) params.set("specialty", specialty);

  const res = await fetch(`${FLASK_BASE_URL}/api/doctors?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load doctors");
  return await res.json(); // { count, doctors }
}

export async function getDoctorAvailabilityUI(doctor_id, date) {
  const res = await fetch(`${FLASK_BASE_URL}/api/ui/doctor-availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doctor_id, date }),
  });

  if (!res.ok) {
    let msg = "Failed to fetch availability";
    try {
      const err = await res.json();
      if (err?.error) msg = err.error;
    } catch (_) {}
    throw new Error(msg);
  }

  return await res.json();
}