import bongcacPhoto from "../assets/faculty/Bongcac.jpg";
import laranjoPhoto from "../assets/faculty/Laranjo.jpg";
import bicoyPhoto from "../assets/faculty/Bicoy.jpg";
import lascoPhoto from "../assets/faculty/Lasco.jpg";
import bravoPhoto from "../assets/faculty/Bravo.png";
import imperialPhoto from "../assets/faculty/Imperial.jpg";
import ageasPhoto from "../assets/faculty/Ageas.jpg";
import lacayaPhoto from "../assets/faculty/Lacaya.jpg";

const FACULTY_MEMBERS = [
  { name: "Engr. Gillert M. Bongcac", position: "Dean", photo: bongcacPhoto },
  { name: "Engr. Romie D. Laranjo", position: "Associate Dean", photo: laranjoPhoto },
  { name: "Engr. Jay Ryan D. Bicoy", position: "Faculty", photo: bicoyPhoto },
  { name: "Engr. Troy C. Lasco", position: "Faculty", photo: lascoPhoto },
  { name: "Engr. Nahum L. Bravo", position: "Faculty", photo: bravoPhoto },
  { name: "Engr. Joy C. Imperial", position: "Faculty", photo: imperialPhoto },
  { name: "Engr. Rhidjel D. Ageas", position: "Faculty", photo: ageasPhoto },
  { name: "Engr. Richie L. Lacaya", position: "Faculty", photo: lacayaPhoto },
];

export default function FacultyMembersModal({ onClose, isDarkMode }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6 shadow-2xl ${
          isDarkMode
            ? "bg-[#111827] text-white"
            : "bg-white text-gray-900"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close faculty members"
          className={`absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-xl ${
            isDarkMode
              ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          X
        </button>

        <div className="mb-7 pr-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
            Faculty Members
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Meet Our Faculty
          </h2>

          <p
            className={`mt-1 text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            College of Engineering Faculty
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACULTY_MEMBERS.map((member) => (
            <div
              key={member.name}
              className={`rounded-2xl border p-4 text-center ${
                isDarkMode
                  ? "border-gray-700 bg-gray-900/60"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <img
                src={member.photo}
                alt={`${member.name} faculty`}
                className="mx-auto h-20 w-20 rounded-full object-cover"
              />

              <h3 className="mt-3 text-sm font-bold">
                {member.name}
              </h3>

              <p className="mt-1 text-xs text-orange-500">
                {member.position}
              </p>
            </div>
          ))}
        </div>

        <div
          className={`mt-7 flex items-center justify-end border-t pt-5 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}