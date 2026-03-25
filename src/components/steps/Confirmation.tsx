'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { Check, Calendar, User, Sparkles, CalendarPlus, Share2 } from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';
import { submitBooking } from '@/lib/api';

interface ConfirmationProps {
  companySlug?: string;
}

export default function Confirmation({ companySlug }: ConfirmationProps) {
  const {
    theme,
    employeesUI,
    selectedEmployeeId,
    anyPerson,
    eligibleEmployeeIds,
    selectedService,
    selectedDate,
    selectedTime,
    customerDetails,
    setSubmitting,
    setBookingConfirmation,
    bookingConfirmation,
    isSubmitting,
    reset,
  } = useBookingStore();

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Find selected employee from employeesUI
  const selectedEmployee = employeesUI.find(e => e.id === selectedEmployeeId);

  const handleConfirm = async () => {
    if (!companySlug || !selectedService || !selectedDate || !selectedTime || !customerDetails) {
      setError('Manjkajo potrebni podatki za rezervacijo');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await submitBooking({
        companySlug,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        serviceId: selectedService.id,
        employeeId: selectedEmployeeId,
        anyPerson,
        eligibleEmployeeIds,
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName,
        email: customerDetails.email,
        phone: customerDetails.phone,
        gender: customerDetails.gender,
        notes: customerDetails.notes,
        gdprSendMarketing: customerDetails.gdprSendMarketing,
        privacyConsent: customerDetails.privacyConsent,
        marketingConsent: customerDetails.gdprSendMarketing,
        consentTimestamp: new Date().toISOString(),
      });

      if (response.success) {
        setBookingConfirmation({
          success: true,
          message: response.message || 'Rezervacija uspešna!',
          storitev: selectedService.naziv,
          datum: format(selectedDate, 'd. MMMM yyyy', { locale: sl }),
          cas: selectedTime,
        });
      } else {
        setError(response.message || 'Rezervacija ni uspela');
      }
    } catch (err) {
      console.error('Failed to submit booking:', err);
      setError('Rezervacija ni uspela. Prosim poskusi znova.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!selectedDate || !selectedTime || !selectedService) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const yr = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dy = String(selectedDate.getDate()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');

    const totalMin = hours * 60 + minutes + selectedService.trajanjeMin;
    const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
    const endM = String(totalMin % 60).padStart(2, '0');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jedro+//Booking//SL',
      'BEGIN:VEVENT',
      `DTSTART:${yr}${mo}${dy}T${hh}${mm}00`,
      `DTEND:${yr}${mo}${dy}T${endH}${endM}00`,
      `SUMMARY:${selectedService.naziv}`,
      `DESCRIPTION:Rezervacija storitve ${selectedService.naziv}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rezervacija.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `Moja rezervacija:\n${bookingConfirmation?.storitev}\n${bookingConfirmation?.datum} ob ${bookingConfirmation?.cas}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Rezervacija potrjena', text });
      } catch {
        // user cancelled
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard unavailable
      }
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Confirmed state
  if (bookingConfirmation?.success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto text-center py-12"
      >
        {/* Success checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="mb-8"
        >
          <motion.div
            className="w-24 h-24 rounded-full border-2 mx-auto flex items-center justify-center"
            style={{ borderColor: theme.primaryColor }}
            animate={{
              boxShadow: [
                `0 0 0 0 ${theme.primaryColor}40`,
                `0 0 0 20px ${theme.primaryColor}00`,
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: 2,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Check
                className="w-12 h-12"
                style={{ color: theme.primaryColor }}
                strokeWidth={2}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-serif text-3xl md:text-4xl mb-3 text-white"
        >
          Rezervacija{' '}
          <span style={{ color: theme.primaryColor }}>
            potrjena
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-white/50 mb-8"
        >
          Veselimo se tvojega obiska!
        </motion.p>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-left space-y-4 mb-12"
        >
          <div className="h-[1px] bg-white/20" />

          {selectedEmployee && (
            <div className="flex justify-between py-2">
              <span className="text-white/50">Specialist</span>
              <span className="font-medium text-white">{selectedEmployee.label}</span>
            </div>
          )}

          {anyPerson && !selectedEmployee && (
            <div className="flex justify-between py-2">
              <span className="text-white/50">Specialist</span>
              <span className="font-medium text-white">Kdorkoli prost</span>
            </div>
          )}

          {bookingConfirmation.storitev && (
            <div className="flex justify-between py-2">
              <span className="text-white/50">Storitev</span>
              <span className="font-medium text-white">{bookingConfirmation.storitev}</span>
            </div>
          )}

          {bookingConfirmation.datum && (
            <div className="flex justify-between py-2">
              <span className="text-white/50">Datum</span>
              <span className="font-medium text-white">
                {bookingConfirmation.datum}
              </span>
            </div>
          )}

          {bookingConfirmation.cas && (
            <div className="flex justify-between py-2">
              <span className="text-white/50">Ura</span>
              <span className="font-light tracking-wider text-white">{bookingConfirmation.cas}</span>
            </div>
          )}

          {selectedService && (
            <div className="flex justify-between py-2">
              <span className="text-white/50">Cena</span>
              <span className="font-light tracking-wider" style={{ color: theme.primaryColor }}>
                €{selectedService.cena}
              </span>
            </div>
          )}

          <div className="h-[1px] bg-white/20" />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {/* Dodaj v koledar */}
          <button
            onClick={handleAddToCalendar}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-light tracking-wide transition-all duration-300 text-white"
            style={{ backgroundColor: theme.primaryColor }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <CalendarPlus className="w-4 h-4" />
            Dodaj v koledar
          </button>

          {/* Deli */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 font-light tracking-wide transition-all duration-300"
            style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.primaryColor;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.primaryColor;
            }}
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Kopirano!' : 'Deli'}
          </button>

          {/* Nova rezervacija */}
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-light tracking-wide transition-all duration-300 text-white/50 hover:text-white"
          >
            Nova rezervacija
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Pre-confirmation state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-serif text-3xl md:text-4xl mb-3 text-white">
          Potrdi{' '}
          <span style={{ color: theme.primaryColor }}>
            rezervacijo
          </span>
        </h1>
        <p className="text-white/60">Prosim preglej podrobnosti termina</p>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg text-red-300 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Booking details */}
      <div className="space-y-8 mb-12">
        {/* Appointment Card */}
        <div className="space-y-6">
          <div className="h-[1px] bg-white/20" />

          {/* Service */}
          {selectedService && (
            <div className="flex items-start gap-4 py-2">
              <Sparkles className="w-5 h-5 text-white/40 mt-1" />
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">Storitev</p>
                <p className="font-serif text-lg text-white">{selectedService.naziv}</p>
                <p className="text-white/40 text-sm">
                  <span className="font-light tracking-wider">{formatDuration(selectedService.trajanjeMin)}</span>
                  {' · '}€{selectedService.cena}
                </p>
              </div>
            </div>
          )}

          {/* Specialist */}
          {selectedEmployee && (
            <div className="flex items-start gap-4 py-2">
              <User className="w-5 h-5 text-white/40 mt-1" />
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">Specialist</p>
                <p className="font-serif text-lg text-white">{selectedEmployee.label}</p>
                <p className="text-white/40 text-sm">{selectedEmployee.subtitle}</p>
              </div>
            </div>
          )}

          {anyPerson && !selectedEmployee && (
            <div className="flex items-start gap-4 py-2">
              <User className="w-5 h-5 text-white/40 mt-1" />
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">Specialist</p>
                <p className="font-serif text-lg text-white">Kdorkoli prost</p>
                <p className="text-white/40 text-sm">Prvi prosti termin</p>
              </div>
            </div>
          )}

          {/* Date & Time */}
          {selectedDate && selectedTime && (
            <div className="flex items-start gap-4 py-2">
              <Calendar className="w-5 h-5 text-white/40 mt-1" />
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">Datum in ura</p>
                <p className="font-serif text-lg text-white">
                  {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl })}
                </p>
                <p className="font-light tracking-wider text-white/40">{selectedTime}</p>
              </div>
            </div>
          )}

          <div className="h-[1px] bg-white/20" />

          {/* Customer Info */}
          {customerDetails && (
            <div className="py-2">
              <p className="text-white/50 text-sm mb-3">Tvoji podatki</p>
              <p className="font-medium text-white">
                {customerDetails.firstName} {customerDetails.lastName}
              </p>
              <p className="text-white/50 text-sm">{customerDetails.email}</p>
              <p className="text-white/50 text-sm">{customerDetails.phone}</p>
              {customerDetails.notes && (
                <p className="text-white/40 text-sm mt-2 italic">
                  &quot;{customerDetails.notes}&quot;
                </p>
              )}
            </div>
          )}

          <div className="h-[1px] bg-white/20" />

          {/* Total */}
          {selectedService && (
            <div className="flex justify-between items-baseline py-4">
              <span className="text-white/50">Skupaj</span>
              <span
                className="font-light text-3xl tracking-wider"
                style={{ color: theme.primaryColor }}
              >
                €{selectedService.cena}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Confirm button */}
      <motion.button
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="px-12 py-4 rounded-full font-medium text-lg transition-all duration-300 text-white relative overflow-hidden"
        style={{ backgroundColor: theme.primaryColor }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSubmitting ? (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span>Potrjujem...</span>
          </motion.div>
        ) : (
          'Potrdi rezervacijo'
        )}
      </motion.button>

      <p className="text-white/40 text-sm mt-4">
        Potrditev bo poslana na vaš email naslov
      </p>
    </motion.div>
  );
}
