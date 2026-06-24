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
import { Plus, Check, X, Calendar, MapPin, Clock } from 'lucide-react';

export const AmenitiesPage: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentAmenity, setCurrentAmenity] = useState<Partial<Amenity>>({
    openTime: '06:00',
    closeTime: '22:00',
    isActive: true,
  });
  const [activeTab, setActiveTab] = useState<'amenities' | 'bookings'>('amenities');

  const fetchData = async () => {
    try {
      const amenitiesRes = await axiosClient.get<Amenity[]>('amenities');
      setAmenities(amenitiesRes.data);
      const bookingsRes = await axiosClient.get<AmenityBooking[]>('bookings');
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Failed to load amenities data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('amenities', currentAmenity);
      setIsOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving amenity:', err);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      await axiosClient.put(`bookings/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Amenities & Bookings</h2>
          <p className="text-xs text-slate-500 mt-1">Configure shared society facilities, operating hours, and manage slot reservation bookings.</p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => {
          setCurrentAmenity({
            name: '',
            description: '',
            location: '',
            openTime: '06:00',
            closeTime: '22:00',
            isActive: true,
          });
          setIsOpen(true);
        }}>
          <Plus size={16} /> Add Facility
        </Button>
      </div>

      <div className="border-b border-slate-100 flex gap-4">
        <button
          onClick={() => setActiveTab('amenities')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'amenities' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Facilities List ({amenities.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'bookings' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Booking Requests ({bookings.length})
        </button>
      </div>

      {activeTab === 'amenities' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {amenities.map((amenity) => (
            <Card key={amenity.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-slate-800">{amenity.name}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                    amenity.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {amenity.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 min-h-[40px]">{amenity.description}</p>
                <div className="space-y-2 mt-4 text-xs font-semibold text-slate-600">
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
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table headers={['Facility', 'Resident Name', 'Flat #', 'Booking Date', 'Time Slot', 'Purpose', 'Status', 'Actions']}>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 font-semibold text-slate-800">{booking.amenityName}</td>
                <td className="px-6 py-4 font-medium">{booking.residentName}</td>
                <td className="px-6 py-4">{booking.flatNumber || 'N/A'}</td>
                <td className="px-6 py-4">{new Date(booking.bookingDate).toLocaleDateString('en-IN')}</td>
                <td className="px-6 py-4">{booking.timeSlot}</td>
                <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{booking.purpose || 'N/A'}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={
                    booking.status === 'Approved' ? 'Paid' :
                    booking.status === 'Requested' ? 'Pending' : 'Overdue'
                  } />
                  <span className="text-xs font-semibold text-slate-500 ml-1.5">{booking.status}</span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  {booking.status === 'Requested' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'Approved')}
                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        title="Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'Rejected')}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                        title="Reject"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New Amenity Facility"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Facility Name"
            type="text"
            value={currentAmenity.name || ''}
            onChange={(e) => setCurrentAmenity({ ...currentAmenity, name: e.target.value })}
            placeholder="e.g. Community Clubhouse"
            required
          />

          <Input
            label="Description"
            type="text"
            value={currentAmenity.description || ''}
            onChange={(e) => setCurrentAmenity({ ...currentAmenity, description: e.target.value })}
            placeholder="Brief overview of rules/facilities..."
            required
          />

          <Input
            label="Location"
            type="text"
            value={currentAmenity.location || ''}
            onChange={(e) => setCurrentAmenity({ ...currentAmenity, location: e.target.value })}
            placeholder="e.g. Ground Floor, Block A"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Opening Time"
              type="text"
              value={currentAmenity.openTime || ''}
              onChange={(e) => setCurrentAmenity({ ...currentAmenity, openTime: e.target.value })}
              placeholder="e.g. 06:00"
              required
            />
            <Input
              label="Closing Time"
              type="text"
              value={currentAmenity.closeTime || ''}
              onChange={(e) => setCurrentAmenity({ ...currentAmenity, closeTime: e.target.value })}
              placeholder="e.g. 22:00"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Facility
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
