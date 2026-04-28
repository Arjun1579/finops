from sqlalchemy import create_engine, Column, Integer, Float, String, Boolean, Date
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./finops.db"
# If using Postgres later: "postgresql://user:password@localhost/finops"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Schema for Petty Cash (Experiment 6)
class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    vendor = Column(String, index=True)
    amount = Column(Float)
    category_code = Column(Integer)
    is_anomaly = Column(Boolean, default=False)
    status = Column(String)

Base.metadata.create_all(bind=engine)