"""
Seeds a couple of demo accounts (same credentials as the original
localStorage-based prototype) plus a handful of sample tickets, so the app
isn't empty on first run. Safe to call repeatedly — no-ops if data exists.

Run manually with:  python -m app.seed
"""
import random
from datetime import datetime, timedelta

from app.database import SessionLocal, init_db
from app.models import StatusEvent, Ticket, User
from app.security import hash_password

DEMO_PASSWORD = "demo1234"

SAMPLE_LOCATIONS = [
    # Islamabad
    (33.6844, 73.0479, "F-7 Markaz, Islamabad"),
    (33.7214, 73.0568, "F-10 Markaz, Islamabad"),
    # Rawalpindi
    (33.5651, 73.0825, "Bahria Town, Rawalpindi"),
    (33.6000, 73.0500, "Saddar, Rawalpindi"),
    # Lahore
    (31.5204, 74.3587, "Gulberg, Lahore"),
    (31.5820, 74.3294, "Model Town, Lahore"),
    (31.4697, 74.2728, "DHA, Lahore"),
    # Multan
    (30.1575, 71.5249, "Gulgasht Colony, Multan"),
    (30.1984, 71.4687, "Cantt, Multan"),
    (30.2259, 71.4781, "Northern Bypass, Multan"),
    # Karachi
    (24.8607, 67.0011, "Clifton, Karachi"),
    (24.9180, 67.0971, "Gulshan-e-Iqbal, Karachi"),
    # Peshawar
    (34.0151, 71.5249, "University Town, Peshawar"),
    # Faisalabad
    (31.4187, 73.0791, "D Ground, Faisalabad"),
    # Quetta
    (30.1798, 66.9750, "Jinnah Town, Quetta"),
]
SAMPLE_CATEGORIES = ["Pothole", "Drain", "Road Damage", "Garbage", "Damaged Pavement"]
SAMPLE_STATUSES = ["Detected", "Verified", "In Progress", "Resolved"]
SAMPLE_PRIORITIES = ["LOW", "MEDIUM", "HIGH"]
SAMPLE_IMAGES = [
    "https://images.pexels.com/photos/259947/pexels-photo-259947.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/378558/pexels-photo-378558.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2531237/pexels-photo-2531237.jpeg?auto=compress&cs=tinysrgb&w=800",
]


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Seed data already present — skipping.")
            return

        citizen = User(
            full_name="Ayesha",
            email="citizen@urbaneye.ai",
            password_hash=hash_password(DEMO_PASSWORD),
            cnic="35201-1234567-1",
            phone_number="0300-1234567",
            date_of_birth="1998-04-12",
            role="CITIZEN",
            account_status="ACTIVE",
            identity_verification_status="DEMO_VERIFIED",
            gender="Female",
            province="Punjab",
            city="Rawalpindi",
            district="Rawalpindi",
            area="Satellite Town",
            address="Street 4, Satellite Town, Rawalpindi",
        )
        officer = User(
            full_name="Officer Khan",
            email="officer@urbaneye.ai",
            password_hash=hash_password(DEMO_PASSWORD),
            cnic="37405-7654321-3",
            phone_number="0301-7654321",
            date_of_birth="1990-01-20",
            role="SUPERVISOR",
            account_status="APPROVED",
            identity_verification_status="DEMO_VERIFIED",
            employee_id="GOV-10245",
            department="Municipal Corporation",
            designation="Supervisor",
            grade="BPS-17",
            jurisdiction_province="Islamabad Capital Territory",
            jurisdiction_city="Islamabad",
            jurisdiction_zone="Zone 2",
            jurisdiction_department="Municipal Corporation",
            gov_verification_status="DEMO_VERIFIED",
            reviewed_by="Demo System Admin",
            reviewed_at=datetime.utcnow(),
        )
        pending_officer = User(
            full_name="Bilal Ahmed",
            email="bilal.ahmed@example.gov.pk",
            password_hash=hash_password(DEMO_PASSWORD),
            cnic="61101-1122334-5",
            phone_number="0333-1122334",
            date_of_birth="1995-06-02",
            role="FIELD_OFFICER",
            account_status="PENDING_APPROVAL",
            identity_verification_status="DEMO_VERIFIED",
            employee_id="GOV-88213",
            department="Solid Waste Management Department",
            designation="Field Inspector",
            grade="BPS-14",
            jurisdiction_province="Punjab",
            jurisdiction_city="Rawalpindi",
            jurisdiction_zone="Zone 3",
            jurisdiction_department="Solid Waste Management Department",
            gov_verification_status="DEMO_VERIFIED",
        )
        db.add_all([citizen, officer, pending_officer])
        db.flush()

        rng = random.Random(42)
        for i in range(15):
            lat, lng, loc = SAMPLE_LOCATIONS[i % len(SAMPLE_LOCATIONS)]
            category = SAMPLE_CATEGORIES[i % len(SAMPLE_CATEGORIES)]
            status_ = SAMPLE_STATUSES[i % len(SAMPLE_STATUSES)]
            priority = rng.choice(SAMPLE_PRIORITIES)
            created = datetime.utcnow() - timedelta(days=rng.randint(0, 18), hours=rng.randint(0, 23))

            ticket = Ticket(
                ticket_id=f"CIV-{1042 + i}",
                citizen_id=citizen.user_id,
                category=category,
                description="Sample seeded report for demo purposes.",
                image_url=SAMPLE_IMAGES[i % len(SAMPLE_IMAGES)],
                latitude=lat + rng.uniform(-0.004, 0.004),
                longitude=lng + rng.uniform(-0.004, 0.004),
                location=loc,
                priority=priority,
                severity=priority if priority != "MEDIUM" else "MEDIUM",
                status=status_,
                confidence=round(rng.uniform(70, 97), 1),
                bbox_x=25, bbox_y=30, bbox_width=40, bbox_height=35,
                created_at=created,
                updated_at=created + timedelta(hours=rng.randint(1, 48)),
            )
            db.add(ticket)
            db.flush()
            db.add(StatusEvent(ticket_pk=ticket.id, status="Detected", note="Report received and AI analysis completed.", timestamp=created))
            if status_ != "Detected":
                db.add(StatusEvent(ticket_pk=ticket.id, status=status_, note="Status updated.", timestamp=ticket.updated_at))

        db.commit()
        print("Seed data created: citizen@urbaneye.ai / officer@urbaneye.ai (password: demo1234)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
