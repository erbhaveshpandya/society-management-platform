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
import { Plus, Calendar, Clock, MapPin, CheckCircle, Info } from 'lucide-react';

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

export const AmenityBookingPage: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [activeTab, setActiveTab] = useState<'amenities' | 'my-bookings'>('amenities');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    bookingDate: new Date().toISOString().split('T')[0],
    timeSlot: TIME_SLOTS[3],
    purpose: ''
  });

  const fetchData = async () => {
    try {
      const amenitiesRes = await axiosClient.get<Amenity[]>('amenities');
      setAmenities(amenitiesRes.data.filter((a) => a.isActive));

      const bookingsRes = await axiosClient.get<AmenityBooking[]>('bookings');
      setBookings(bookingsRes.data);
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

  if (loading) return <LoadingSpinner />;

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
          <Calendar size={20} />
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

      {activeTab === 'amenities' ? (
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
                    setIsOpen(true);
                  }}
                >
                  <Plus size={14} /> Request Slot Booking
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
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
              <Calendar className="mx-auto text-slate-300 mb-3" size={32} />
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
