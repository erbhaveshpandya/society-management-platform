import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Amenity, AmenityBooking } from '../../types';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, CheckCircle, Info, ChevronLeft, ChevronRight, Lock, Check } from 'lucide-react';

const TIME_SLOTS = [
  '06:00 - 08:00',
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface OccupiedSlot {
  amenityId: number;
  bookingDate: string;
  timeSlot: string;
}

export const AmenityBookingPage: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [activeTab, setActiveTab] = useState<'amenities' | 'calendar' | 'my-bookings'>('amenities');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Calendar states
  const [selectedCalendarAmenityId, setSelectedCalendarAmenityId] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: TIME_SLOTS[3],
    purpose: ''
  });

  const fetchData = async () => {
    try {
      const [amenitiesRes, bookingsRes, occupiedRes] = await Promise.all([
        axiosClient.get<Amenity[]>('amenities'),
        axiosClient.get<AmenityBooking[]>('bookings'),
        axiosClient.get<OccupiedSlot[]>('bookings/occupied')
      ]);

      setAmenities(amenitiesRes.data.filter((a) => a.isActive));
      setBookings(bookingsRes.data);
      setOccupiedSlots(occupiedRes.data);

      // Auto select first amenity for calendar if none selected
      const activeAmenities = amenitiesRes.data.filter((a) => a.isActive);
      if (activeAmenities.length > 0 && !selectedCalendarAmenityId) {
        setSelectedCalendarAmenityId(activeAmenities[0].id);
      }
    } catch (err) {
      console.error('Failed to load amenities booking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axiosClient.post('bookings', {
        amenityId: selectedAmenity.id,
        bookingDate: formData.bookingDate,
        timeSlot: formData.timeSlot,
        purpose: formData.purpose
      });
      
      setSuccessMsg(`Booking requested for ${selectedAmenity.name}!`);
      setIsOpen(false);
      setFormData({
        bookingDate: new Date().toISOString().split('T')[0],
        timeSlot: TIME_SLOTS[3],
        purpose: ''
      });
      fetchData();
      setActiveTab('my-bookings');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      console.error('Error reserving slot:', err);
      setErrorMsg(err.response?.data || 'Failed to submit booking. Check for slot conflicts.');
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const openBookingForSlot = (dateStr: string, slotStr: string) => {
    const amenity = amenities.find(a => a.id === selectedCalendarAmenityId);
    if (!amenity) return;

    setSelectedAmenity(amenity);
    setFormData({
      bookingDate: dateStr,
      timeSlot: slotStr,
      purpose: ''
    });
    setIsOpen(true);
  };

  if (loading) return <LoadingSpinner />;

  // Render Calendar Grid Cells
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [];

  // Padding cells
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Facility Reservations</h2>
          <p className="text-xs text-slate-500 mt-1">
            Book community assets like clubhouse halls, sports court slots, and lawn areas for personal events.
          </p>
        </div>
        <div className="p-2 bg-slate-100/80 rounded-lg text-slate-600">
          <CalendarIcon size={20} />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-4 border-b border-slate-100 pb-px">
        <button
          onClick={() => setActiveTab('amenities')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'amenities'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Book Facilities
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'calendar'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Availability Calendar
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'my-bookings'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          My Bookings History ({bookings.length})
        </button>
      </div>

      {activeTab === 'amenities' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {amenities.map((amenity) => (
            <Card key={amenity.id} className="p-6 bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-base font-bold text-slate-800">{amenity.name}</h3>
                <p className="text-xs text-slate-500 mt-2 min-h-[40px] leading-relaxed">
                  {amenity.description}
                </p>
                <div className="space-y-2 mt-4 text-xs font-semibold text-slate-600 border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{amenity.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    <span>Timings: {amenity.openTime} - {amenity.closeTime}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  className="w-full flex items-center justify-center gap-1.5 text-xs py-2 bg-slate-900 hover:bg-slate-800 text-white"
                  onClick={() => {
                    setSelectedAmenity(amenity);
                    setFormData({
                      bookingDate: new Date().toISOString().split('T')[0],
                      timeSlot: TIME_SLOTS[3],
                      purpose: ''
                    });
                    setIsOpen(true);
                  }}
                >
                  <Plus size={14} /> Request Slot Booking
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Select Amenity:</label>
              <select
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 font-semibold"
                value={selectedCalendarAmenityId || ''}
                onChange={(e) => setSelectedCalendarAmenityId(Number(e.target.value))}
              >
                {amenities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-sm text-slate-700 min-w-[120px] text-center">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Monthly Calendar View */}
            <Card className="lg:col-span-2 p-5 bg-white">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-50 pb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-14 bg-slate-50/50 border border-transparent rounded-lg"></div>;
                  }

                  const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const dayBookings = occupiedSlots.filter(
                    (s) => s.amenityId === selectedCalendarAmenityId && s.bookingDate.split('T')[0] === dateStr
                  );
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const isSelected = selectedDate === dateStr;
                  const isFull = dayBookings.length >= TIME_SLOTS.length;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-14 border p-1 rounded-lg text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/10 ring-2 ring-primary-100'
                          : isToday
                          ? 'border-slate-800 bg-slate-50'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isToday ? 'text-slate-800' : 'text-slate-500'}`}>{day}</span>
                      
                      <div className="w-full">
                        {isFull ? (
                          <span className="text-[8px] font-bold text-red-600 bg-red-50 border border-red-100 px-1 rounded block text-center truncate">Full</span>
                        ) : dayBookings.length > 0 ? (
                          <span className="text-[8px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1 rounded block text-center truncate">
                            {dayBookings.length} Booked
                          </span>
                        ) : (
                          <span className="text-[8px] font-semibold text-emerald-600 bg-emerald-50/50 px-1 rounded block text-center truncate">Free</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Time Slot Inspector */}
            <Card className="lg:col-span-1 p-5 bg-white text-left">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800">Slots for Date</h3>
                <p className="text-[11px] font-bold text-primary-600 mt-1">
                  {new Date(selectedDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div className="space-y-2">
                {TIME_SLOTS.map((slot) => {
                  const isOccupied = occupiedSlots.some(
                    (s) =>
                      s.amenityId === selectedCalendarAmenityId &&
                      s.bookingDate.split('T')[0] === selectedDate &&
                      s.timeSlot === slot
                  );

                  return (
                    <div
                      key={slot}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold ${
                        isOccupied
                          ? 'bg-slate-50/50 border-slate-100 text-slate-400'
                          : 'bg-emerald-50/20 border-emerald-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isOccupied ? <Lock size={12} className="text-slate-300" /> : <Check size={12} className="text-emerald-500" />}
                        <span className="font-mono">{slot}</span>
                      </div>
                      
                      {isOccupied ? (
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Booked</span>
                      ) : (
                        <button
                          onClick={() => openBookingForSlot(selectedDate, slot)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] uppercase font-bold tracking-wider transition-colors"
                        >
                          Book Slot
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'my-bookings' && (
        <Card>
          {bookings.length > 0 ? (
            <Table headers={['Facility', 'Booking Date', 'Time Slot', 'Purpose', 'Request Status', 'Date Created']}>
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{booking.amenityName}</td>
                  <td className="px-6 py-4 font-semibold">
                    {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{booking.timeSlot}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{booking.purpose || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={
                      booking.status === 'Approved' ? 'Paid' :
                      booking.status === 'Requested' ? 'Pending' : 'Overdue'
                    } />
                    <span className="text-xs font-semibold text-slate-600 ml-1.5">{booking.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                    {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="py-12 text-center">
              <CalendarIcon className="mx-auto text-slate-300 mb-3" size={32} />
              <h4 className="text-sm font-bold text-slate-700">No booking requests found</h4>
              <p className="text-xs text-slate-500 mt-1">
                You have not booked any shared facilities yet. Switch to the bookings tab to request slots.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Booking Form Modal */}
      {selectedAmenity && (
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={`Book Slot - ${selectedAmenity.name}`}
        >
          <form onSubmit={handleBooking} className="space-y-4 text-left">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2.5">
              <Info className="text-primary-600 shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-xs font-bold text-slate-700">Location: {selectedAmenity.location}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  Timings are strictly limited between {selectedAmenity.openTime} and {selectedAmenity.closeTime}.
                </p>
              </div>
            </div>

            <Input
              label="Booking Date"
              type="date"
              value={formData.bookingDate}
              onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
              required
            />

            <div className="text-left mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Time Slot</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                required
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Purpose of Booking"
              placeholder="e.g. Birthday Party, Yoga Class"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
