// src/features/contact/components/ContactForm.tsx
"use client";

import { useState } from "react";
import type { InquiryRequest, InquiryResponse } from "@/types";
import DownChevronIcon from "@/components/icons/DownChevronIcon"; // Asegúrate de tenerlo

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [messageLength, setMessageLength] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "message") setMessageLength(value.length);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !selectedOption || !formData.message.trim()) {
      setSubmitStatus({ type: "error", message: "Por favor completa todos los campos requeridos." });
      return;
    }
    if (!acceptedPolicy) {
      setSubmitStatus({ type: "error", message: "Debes aceptar la política de privacidad." });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const inquiryData: InquiryRequest = {
        name: formData.name.trim(), email: formData.email.trim(), phone: formData.phone.trim(), inquiryType: selectedOption, message: formData.message.trim(),
      };

      const response = await fetch("/api/custom", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(inquiryData),
      });
      const result: InquiryResponse = await response.json();

      if (result.status === "success") {
        setSubmitStatus({ type: "success", message: result.code === "INQUIRY_DISPATCHED" ? "¡Tu consulta ha sido enviada exitosamente!" : "Consulta enviada." });
        setFormData({ name: "", email: "", phone: "", message: "" });
        setSelectedOption(""); setAcceptedPolicy(false); setMessageLength(0);
      } else {
        setSubmitStatus({ type: "error", message: result.details || "Error al enviar tu consulta." });
      }
    } catch {
      setSubmitStatus({ type: "error", message: "Error de conexión." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full h-[44px] rounded-[8px] border border-gray-300 px-[10px] py-[10px] text-[14px] text-[#303030] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 bg-white";

  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-semibold text-gray-800">¿Tienes alguna consulta?</h3>

      <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nombre" disabled={isSubmitting} className={inputClass} />
      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Correo electrónico" disabled={isSubmitting} className={inputClass} />
      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Teléfono" disabled={isSubmitting} className={inputClass} />

      <div className="relative dropdown-container">
        <button
          type="button"
          onClick={() => !isSubmitting && setDropdownOpen(!dropdownOpen)}
          disabled={isSubmitting}
          className={`${inputClass} pr-[34px] text-left flex items-center justify-between`}
        >
          <span className={selectedOption ? "text-[#303030]" : "text-gray-400"}>
            {selectedOption || "Solicito información para"}
          </span>
          <DownChevronIcon className={`w-4 h-4 transform transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-[8px] shadow-lg z-10">
            {["Comprar un apartamento", "Conocer más sobre el proyecto", "Realizar una cita con un agente de ventas", "Otro motivo"].map((option) => (
              <button
                key={option} type="button"
                onClick={() => { setSelectedOption(option); setDropdownOpen(false); }}
                className="w-full px-[10px] py-[10px] text-[14px] text-gray-700 hover:bg-[#303030] hover:text-white transition-colors duration-150 text-left first:rounded-t-[8px] last:rounded-b-[8px]"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <textarea name="message" value={formData.message} onChange={handleInputChange} maxLength={500} placeholder="Mensaje" disabled={isSubmitting} className={`${inputClass} resize-none`} />
        <div className="text-right text-[12px] text-gray-500 mt-1">{messageLength}/500 caracteres</div>
      </div>

      <label className="flex items-start gap-2 text-[14px] text-gray-700 mt-10 cursor-pointer">
        <input type="checkbox" checked={acceptedPolicy} onChange={(e) => setAcceptedPolicy(e.target.checked)} disabled={isSubmitting} className="mt-[3px] w-4 h-4 rounded border-gray-400 disabled:opacity-50" />
        <span>He leído y acepto la <a href="#" className="underline">política de privacidad</a></span>
      </label>

      {submitStatus.type && (
        <div className={`p-3 rounded-lg text-[14px] ${submitStatus.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {submitStatus.message}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-10 h-[42px] w-[150px] rounded-xl bg-[#343330] text-white text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4a4845] transition-colors"
      >
        {isSubmitting ? "ENVIANDO..." : "ENVIAR"}
      </button>
    </div>
  );
}
