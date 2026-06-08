import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addBooking } from "@/lib/booking-store";
import type { TimeBatch } from "@/lib/booking-store";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/bookings';

const GAMES = ["Cricket", "Badminton", "Karate", "Kabaddi"] as const;
const TIME_SLOTS = [
  { slot: "8-9", batch: "morning" },
  { slot: "9-10", batch: "morning" },
  { slot: "10-11", batch: "morning" },
  { slot: "11-12", batch: "morning" },
  { slot: "12-1", batch: "afternoon" },
  { slot: "1-2", batch: "afternoon" },
  { slot: "2-3", batch: "afternoon" },
  { slot: "3-4", batch: "afternoon" },
  { slot: "4-5", batch: "evening" },
  { slot: "5-6", batch: "evening" },
  { slot: "6-7", batch: "evening" },
  { slot: "9-10 PM", batch: "night" },
  { slot: "10-11 PM", batch: "night" }
] as const;

export function BookingForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    game: "",
    date: "",
    timeSlot: "",
    players: ""
  });
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);
  const [approvedTimeSlots, setApprovedTimeSlots] = useState<string[]>([]);

  const getBatch = (timeSlot: string): TimeBatch => {
    const slotData = TIME_SLOTS.find(s => s.slot === timeSlot);
    const batch = slotData?.batch || "morning";
    // Type guard to ensure the value is a valid TimeBatch
    if (batch === "morning" || batch === "afternoon" || batch === "evening" || batch === "night") {
      return batch;
    }
    return "morning"; // Fallback
  };

  // Fetch booked time slots when dialog opens or sport/date changes
  useEffect(() => {
    if (open && formData.game && formData.date) {
      fetchBookedTimeSlots();
      // Poll every 5 seconds to get latest updates
      const interval = setInterval(fetchBookedTimeSlots, 5000);
      return () => clearInterval(interval);
    }
  }, [open, formData.game, formData.date]);

  const fetchBookedTimeSlots = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      const data = await response.json();
      if (data.success) {
        const bookedSlots = data.bookings
          .filter((booking: any) =>
            booking.sport === formData.game &&
            booking.date === formData.date &&
            (booking.status === 'Pending' || booking.status === 'Approved')
          )
          .map((booking: any) => booking.time);
        setBookedTimeSlots(bookedSlots);
        
        const approvedSlots = data.bookings
          .filter((booking: any) =>
            booking.sport === formData.game &&
            booking.date === formData.date &&
            booking.status === 'Approved'
          )
          .map((booking: any) => booking.time);
        setApprovedTimeSlots(approvedSlots);
        
        console.log('Booked time slots:', bookedSlots);
        console.log('Approved time slots:', approvedSlots);
      }
    } catch (error) {
      console.error('Error fetching booked time slots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted with data:", formData);
    
    // Check if all required fields are filled
    if (!formData.name || !formData.phone || !formData.game || !formData.date || !formData.timeSlot || !formData.players) {
      console.error("Missing required fields");
      alert("Please fill in all required fields");
      return;
    }

    // Set loading state
    const submitButton = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Processing...";
    }

    try {
      // Call backend API
      console.log("Submitting booking to backend API...");
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          sport: formData.game,
          date: formData.date,
          time: formData.timeSlot
        }),
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        
        // Show specific error message from API
        const errorMessage = errorData.details || errorData.error || "Failed to submit booking";
        alert(`Booking Error: ${errorMessage}`);
        
        // Re-enable submit button on error
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Book Now";
        }
        return;
      }

      const result = await response.json();
      console.log("API Success:", result);

      // Calculate batch info for local store
      const batch = getBatch(formData.timeSlot);
      const displayBatch = batch.charAt(0).toUpperCase() + batch.slice(1);
      
      // Ensure batch is a valid TimeBatch value
      const validBatch: TimeBatch = (
        batch === "morning" || batch === "afternoon" || batch === "evening" || batch === "night"
          ? batch
          : "morning"
      );
      
      // Only save to local store if we're in a browser environment
      console.log("Browser check:", typeof window !== "undefined");
      if (typeof window !== "undefined") {
        try {
          console.log("Attempting to save to local store...");
          const booking = addBooking({
            name: formData.name,
            phone: formData.phone,
            turf: formData.game,
            sport: formData.game,
            datetime: new Date(`${formData.date}T${formData.timeSlot.split('-')[0]}:00:00`).toISOString(),
            players: parseInt(formData.players),
            price: 500,
            batch: validBatch,
            preferredLocation: "Chennimalai",
            dealNotes: `Time slot: ${formData.timeSlot}`,
          });
          console.log("Booking saved to local store successfully:", booking);
          
          // Verify the save by checking localStorage directly
          const storedData = localStorage.getItem("turfpro:store:v1");
          console.log("Current localStorage data:", storedData);
          
          // Force a storage event to notify other tabs
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'turfpro:store:v1',
            newValue: storedData,
            oldValue: storedData,
            url: window.location.href
          }));
        } catch (storeError) {
          console.error("Error saving to local store:", storeError);
          // Silent fail on local storage issues - booking is still submitted via API
        }
      } else {
        console.log("SSR environment - skipping local store save, booking saved via API only");
      }

      // Send WhatsApp message to sports pitch owner
      const message = `I would like to book your sports pitch!!\n\nCustomer Details:\nName: ${formData.name}\nPhone: ${formData.phone}\nGame: ${formData.game}\nDate: ${formData.date}\nTime: ${formData.timeSlot}\nPlayers: ${formData.players}`;

      console.log("WhatsApp message:", message);
      
      const phoneNumber = "9865750184"; // Sports pitch owner's phone number
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      console.log("WhatsApp URL:", whatsappUrl);
      
      // Mobile detection and direct redirect for better mobile support
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Close dialog and reset form for both mobile and desktop
      setOpen(false);
      setFormData({
        name: "",
        phone: "",
        game: "",
        date: "",
        timeSlot: "",
        players: ""
      });
      
      if (isMobile) {
        // For mobile devices, use direct location change to avoid popup blockers
        console.log("Mobile device detected, using direct redirect");
        window.location.href = whatsappUrl;
      } else {
        // For desktop, try window.open first, fallback to direct redirect
        try {
          const newWindow = window.open(whatsappUrl, "_blank");
          if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
            console.log("Popup blocked, using direct redirect");
            window.location.href = whatsappUrl;
          } else {
            console.log("WhatsApp opened in new tab");
          }
        } catch (error) {
          console.error("Error opening WhatsApp:", error);
          window.location.href = whatsappUrl;
        }
        // Show success message only for desktop
        alert("Booking submitted successfully! WhatsApp should open shortly.");
      }

    } catch (error) {
      console.error("Network or parsing error:", error);
      alert("Network error: Unable to connect to server. Please check your internet connection and try again.");
      
      // Re-enable submit button on error
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Book Now";
      }
    } finally {
      // Re-enable submit button if not already done
      if (submitButton && submitButton.disabled) {
        submitButton.disabled = false;
        submitButton.textContent = "Book Now";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-black font-bold text-lg py-4 px-6 shadow-lg hover:bg-red-600 hover:text-white transition-all duration-300">
          Book Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book Your Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="game">Game</Label>
            <Select required value={formData.game} onValueChange={(value) => setFormData({ ...formData, game: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {GAMES.map((game) => (
                  <SelectItem key={game} value={game}>{game}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              required
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot</Label>
            <Select required value={formData.timeSlot} onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((item) => {
                  const isBooked = bookedTimeSlots.includes(item.slot);
                  const isApproved = approvedTimeSlots.includes(item.slot);
                  return (
                    <SelectItem 
                      key={item.slot} 
                      value={item.slot}
                      disabled={isBooked}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span style={isApproved ? { color: 'red', fontWeight: 'bold' } : isBooked ? { color: 'orange', fontWeight: 'bold' } : {}}>{item.slot}</span>
                        <span style={isApproved ? { color: 'red', fontWeight: 'bold', fontSize: '12px', marginLeft: '8px' } : isBooked ? { color: 'orange', fontWeight: 'bold', fontSize: '12px', marginLeft: '8px' } : { fontSize: '12px', marginLeft: '8px', color: '#6b7280' }}>
                          ({item.batch.charAt(0).toUpperCase() + item.batch.slice(1)})
                          {isApproved && " - Locked"}
                          {isBooked && !isApproved && " - Pending"}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formData.timeSlot && (
              <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-semibold text-primary-glow">
                  Batch: {getBatch(formData.timeSlot).charAt(0).toUpperCase() + getBatch(formData.timeSlot).slice(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.timeSlot} falls in {getBatch(formData.timeSlot)} session
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="players">Number of Players</Label>
            <Input
              id="players"
              required
              type="number"
              min="1"
              max="20"
              value={formData.players}
              onChange={(e) => setFormData({ ...formData, players: e.target.value })}
              placeholder="Enter number of players"
            />
          </div>

          <Button type="submit" className="w-full bg-white text-black font-bold text-lg py-4 px-6 shadow-lg hover:bg-red-600 hover:text-white transition-all duration-300">
            Book Now
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
