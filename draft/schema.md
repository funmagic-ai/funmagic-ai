# models.py - SQLAlchemy 2.0 Async Models                                                                                                                         
  # Generated from Drizzle ORM schema                                                                                                                               
                                                                                                                                                                    
  from datetime import datetime                                                                                                                                     
  from decimal import Decimal                                                                                                                                       
  from enum import Enum                                                                                                                                             
  from typing import Any, Optional                                                                                                                                  
  from uuid import UUID, uuid4                                                                                                                                      
                                                                                                                                                                    
  from sqlalchemy import (                                                                                                                                          
      Boolean,                                                                                                                                                      
      DateTime,                                                                                                                                                     
      ForeignKey,                                                                                                                                                   
      Index,                                                                                                                                                        
      Integer,                                                                                                                                                      
      Numeric,                                                                                                                                                      
      String,                                                                                                                                                       
      Text,                                                                                                                                                         
      UniqueConstraint,                                                                                                                                             
      func,                                                                                                                                                         
  )                                                                                                                                                                 
  from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID                                                                                                  
  from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship                                                                                   
                                                                                                                                                                    
                                                                                                                                                                    
  class Base(DeclarativeBase):                                                                                                                                      
      pass                                                                                                                                                          
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # Enums                                                                                                                                                           
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class UserRole(str, Enum):                                                                                                                                        
      USER = "user"                                                                                                                                                 
      ADMIN = "admin"                                                                                                                                               
      SUPER_ADMIN = "super_admin"                                                                                                                                   
                                                                                                                                                                    
                                                                                                                                                                    
  class ProviderType(str, Enum):                                                                                                                                    
      OPENAI = "openai"                                                                                                                                             
      ANTHROPIC = "anthropic"                                                                                                                                       
      REPLICATE = "replicate"                                                                                                                                       
      STABILITY = "stability"                                                                                                                                       
      ELEVENLABS = "elevenlabs"                                                                                                                                     
      FAL = "fal"                                                                                                                                                   
      TRIPO = "tripo"                                                                                                                                               
      SELF_HOSTED = "self_hosted"                                                                                                                                   
      CUSTOM = "custom"                                                                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  class TaskStatus(str, Enum):                                                                                                                                      
      PENDING = "pending"                                                                                                                                           
      QUEUED = "queued"                                                                                                                                             
      PROCESSING = "processing"                                                                                                                                     
      COMPLETED = "completed"                                                                                                                                       
      FAILED = "failed"                                                                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  class TransactionType(str, Enum):                                                                                                                                 
      PURCHASE = "purchase"                                                                                                                                         
      BONUS = "bonus"                                                                                                                                               
      WELCOME = "welcome"                                                                                                                                           
      USAGE = "usage"                                                                                                                                               
      REFUND = "refund"                                                                                                                                             
      RESERVATION = "reservation"                                                                                                                                   
      RELEASE = "release"                                                                                                                                           
      ADMIN_ADJUST = "admin_adjust"                                                                                                                                 
      EXPIRY = "expiry"                                                                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  class ReferenceType(str, Enum):                                                                                                                                   
      TASK = "task"                                                                                                                                                 
      WORKFLOW = "workflow"                                                                                                                                         
      PAYMENT = "payment"                                                                                                                                           
      PACKAGE = "package"                                                                                                                                           
      ADMIN = "admin"                                                                                                                                               
      SYSTEM = "system"                                                                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  class BannerType(str, Enum):                                                                                                                                      
      MAIN = "main"                                                                                                                                                 
      SIDE = "side"                                                                                                                                                 
                                                                                                                                                                    
                                                                                                                                                                    
  class LinkTarget(str, Enum):                                                                                                                                      
      SELF = "_self"                                                                                                                                                
      BLANK = "_blank"                                                                                                                                              
                                                                                                                                                                    
                                                                                                                                                                    
  class AssetVisibility(str, Enum):                                                                                                                                 
      PRIVATE = "private"                                                                                                                                           
      PUBLIC = "public"                                                                                                                                             
      ADMIN_PRIVATE = "admin-private"                                                                                                                               
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # Users & Auth (Better Auth compatible)                                                                                                                           
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class User(Base):                                                                                                                                                 
      __tablename__ = "users"                                                                                                                                       
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)                                                                                         
      email_verified: Mapped[bool] = mapped_column(Boolean, default=False)                                                                                          
      name: Mapped[Optional[str]] = mapped_column(Text)                                                                                                             
      image: Mapped[Optional[str]] = mapped_column(Text)                                                                                                            
      role: Mapped[str] = mapped_column(Text, nullable=False, default="user")                                                                                       
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
      # Relationships                                                                                                                                               
      sessions: Mapped[list["Session"]] = relationship(back_populates="user", cascade="all, delete-orphan")                                                         
      accounts: Mapped[list["Account"]] = relationship(back_populates="user", cascade="all, delete-orphan")                                                         
      credit: Mapped[Optional["Credit"]] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)                                         
      credit_transactions: Mapped[list["CreditTransaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")                                    
      tasks: Mapped[list["Task"]] = relationship(back_populates="user", cascade="all, delete-orphan")                                                               
      assets: Mapped[list["Asset"]] = relationship(back_populates="user", cascade="all, delete-orphan")                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  class Session(Base):                                                                                                                                              
      __tablename__ = "sessions"                                                                                                                                    
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      user_id: Mapped[UUID] = mapped_column(                                                                                                                        
          PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False                                                                          
      )                                                                                                                                                             
      token: Mapped[str] = mapped_column(Text, nullable=False, unique=True)                                                                                         
      expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)                                                                                        
      ip_address: Mapped[Optional[str]] = mapped_column(Text)                                                                                                       
      user_agent: Mapped[Optional[str]] = mapped_column(Text)                                                                                                       
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
      user: Mapped["User"] = relationship(back_populates="sessions")                                                                                                
                                                                                                                                                                    
                                                                                                                                                                    
  class Account(Base):                                                                                                                                              
      __tablename__ = "accounts"                                                                                                                                    
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      user_id: Mapped[UUID] = mapped_column(                                                                                                                        
          PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False                                                                          
      )                                                                                                                                                             
      account_id: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                 
      provider_id: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                
      access_token: Mapped[Optional[str]] = mapped_column(Text)                                                                                                     
      refresh_token: Mapped[Optional[str]] = mapped_column(Text)                                                                                                    
      access_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                 
      refresh_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                
      scope: Mapped[Optional[str]] = mapped_column(Text)                                                                                                            
      id_token: Mapped[Optional[str]] = mapped_column(Text)                                                                                                         
      password: Mapped[Optional[str]] = mapped_column(Text)                                                                                                         
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
      user: Mapped["User"] = relationship(back_populates="accounts")                                                                                                
                                                                                                                                                                    
                                                                                                                                                                    
  class Verification(Base):                                                                                                                                         
      __tablename__ = "verifications"                                                                                                                               
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      identifier: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                 
      value: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                      
      expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)                                                                                        
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # AI Providers                                                                                                                                                    
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class Provider(Base):                                                                                                                                             
      __tablename__ = "providers"                                                                                                                                   
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)                                                                                          
      display_name: Mapped[str] = mapped_column(Text, nullable=False)                                                                                               
      description: Mapped[Optional[str]] = mapped_column(Text)                                                                                                      
      type: Mapped[str] = mapped_column(Text, nullable=False)  # ProviderType enum values                                                                           
      api_key: Mapped[Optional[str]] = mapped_column(Text)  # Encrypted                                                                                             
      api_secret: Mapped[Optional[str]] = mapped_column(Text)  # Encrypted                                                                                          
      base_url: Mapped[Optional[str]] = mapped_column(Text)                                                                                                         
      webhook_secret: Mapped[Optional[str]] = mapped_column(Text)                                                                                                   
      config: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)                                                                                               
      is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)                                                                                
      health_check_url: Mapped[Optional[str]] = mapped_column(Text)                                                                                                 
      last_health_check_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                    
      is_healthy: Mapped[bool] = mapped_column(Boolean, default=True)                                                                                               
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # Tool Types (Categories)                                                                                                                                         
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class ToolType(Base):                                                                                                                                             
      __tablename__ = "tool_types"                                                                                                                                  
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)                                                                                          
      display_name: Mapped[str] = mapped_column(Text, nullable=False)                                                                                               
      description: Mapped[Optional[str]] = mapped_column(Text)                                                                                                      
      icon: Mapped[Optional[str]] = mapped_column(Text)                                                                                                             
      color: Mapped[Optional[str]] = mapped_column(Text)                                                                                                            
      is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)                                                                                
      sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)                                                                                   
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
      # Relationships                                                                                                                                               
      tools: Mapped[list["Tool"]] = relationship(back_populates="tool_type")                                                                                        
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # Tools                                                                                                                                                           
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class Tool(Base):                                                                                                                                                 
      __tablename__ = "tools"                                                                                                                                       
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      slug: Mapped[str] = mapped_column(Text, nullable=False, unique=True)                                                                                          
      title: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                      
      description: Mapped[Optional[str]] = mapped_column(Text)                                                                                                      
      short_description: Mapped[Optional[str]] = mapped_column(Text)                                                                                                
      thumbnail: Mapped[Optional[str]] = mapped_column(Text)                                                                                                        
      tool_type_id: Mapped[UUID] = mapped_column(                                                                                                                   
          PGUUID(as_uuid=True), ForeignKey("tool_types.id"), nullable=False                                                                                         
      )                                                                                                                                                             
      config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)                                                                                         
      is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)                                                                                
      is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)                                                                             
      usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)                                                                                  
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
      # Relationships                                                                                                                                               
      tool_type: Mapped["ToolType"] = relationship(back_populates="tools")                                                                                          
      tasks: Mapped[list["Task"]] = relationship(back_populates="tool")                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # Tasks (with parent/child hierarchy)                                                                                                                             
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class Task(Base):                                                                                                                                                 
      __tablename__ = "tasks"                                                                                                                                       
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      user_id: Mapped[UUID] = mapped_column(                                                                                                                        
          PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False                                                                          
      )                                                                                                                                                             
      tool_id: Mapped[UUID] = mapped_column(                                                                                                                        
          PGUUID(as_uuid=True), ForeignKey("tools.id"), nullable=False                                                                                              
      )                                                                                                                                                             
      parent_task_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))                                                                                  
      step_id: Mapped[Optional[str]] = mapped_column(Text)                                                                                                          
      step_index: Mapped[Optional[int]] = mapped_column(Integer)                                                                                                    
      status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")                                                                                  
      input: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)                                                                                                
      output: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)                                                                                               
      error: Mapped[Optional[str]] = mapped_column(Text)                                                                                                            
      provider_request: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)                                                                                     
      provider_response: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)                                                                                    
      provider_meta: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)                                                                                        
      bullmq_job_id: Mapped[Optional[str]] = mapped_column(Text)                                                                                                    
      credits_cost: Mapped[int] = mapped_column(Integer, nullable=False, default=0)                                                                                 
      queued_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                               
      started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                              
      completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                            
      attempt_count: Mapped[int] = mapped_column(Integer, default=0)                                                                                                
      max_attempts: Mapped[int] = mapped_column(Integer, default=3)                                                                                                 
      current_step_id: Mapped[Optional[str]] = mapped_column(Text)                                                                                                  
      current_step_index: Mapped[int] = mapped_column(Integer, default=0)                                                                                           
      awaiting_confirmation: Mapped[bool] = mapped_column(Boolean, default=False)                                                                                   
      step_states: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)                                                                                          
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
      deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)  # Soft delete                                                                               
                                                                                                                                                                    
      # Relationships                                                                                                                                               
      user: Mapped["User"] = relationship(back_populates="tasks")                                                                                                   
      tool: Mapped["Tool"] = relationship(back_populates="tasks")                                                                                                   
      assets: Mapped[list["Asset"]] = relationship(back_populates="task")                                                                                           
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # Credits                                                                                                                                                         
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class Credit(Base):                                                                                                                                               
      __tablename__ = "credits"                                                                                                                                     
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      user_id: Mapped[UUID] = mapped_column(                                                                                                                        
          PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True                                                             
      )                                                                                                                                                             
      balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)                                                                                      
      reserved_balance: Mapped[int] = mapped_column(Integer, default=0)                                                                                             
      lifetime_purchased: Mapped[int] = mapped_column(Integer, default=0)                                                                                           
      lifetime_used: Mapped[int] = mapped_column(Integer, default=0)                                                                                                
      lifetime_refunded: Mapped[int] = mapped_column(Integer, default=0)                                                                                            
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
      user: Mapped["User"] = relationship(back_populates="credit")                                                                                                  
                                                                                                                                                                    
                                                                                                                                                                    
  class CreditTransaction(Base):                                                                                                                                    
      __tablename__ = "credit_transactions"                                                                                                                         
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      user_id: Mapped[UUID] = mapped_column(                                                                                                                        
          PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False                                                                          
      )                                                                                                                                                             
      type: Mapped[str] = mapped_column(Text, nullable=False)  # TransactionType enum                                                                               
      amount: Mapped[int] = mapped_column(Integer, nullable=False)                                                                                                  
      balance_after: Mapped[int] = mapped_column(Integer, nullable=False)                                                                                           
      description: Mapped[Optional[str]] = mapped_column(Text)                                                                                                      
      reference_type: Mapped[Optional[str]] = mapped_column(Text)  # ReferenceType enum                                                                             
      reference_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))                                                                                    
      metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)                                                                                             
      idempotency_key: Mapped[Optional[str]] = mapped_column(Text, unique=True)                                                                                     
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
                                                                                                                                                                    
      user: Mapped["User"] = relationship(back_populates="credit_transactions")                                                                                     
                                                                                                                                                                    
                                                                                                                                                                    
  class CreditPackage(Base):                                                                                                                                        
      __tablename__ = "credit_packages"                                                                                                                             
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      name: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                       
      description: Mapped[Optional[str]] = mapped_column(Text)                                                                                                      
      credits: Mapped[int] = mapped_column(Integer, nullable=False)                                                                                                 
      bonus_credits: Mapped[int] = mapped_column(Integer, default=0)                                                                                                
      price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)                                                                                        
      currency: Mapped[str] = mapped_column(Text, nullable=False, default="USD")                                                                                    
      stripe_price_id: Mapped[Optional[str]] = mapped_column(Text)                                                                                                  
      stripe_product_id: Mapped[Optional[str]] = mapped_column(Text)                                                                                                
      is_popular: Mapped[bool] = mapped_column(Boolean, default=False)                                                                                              
      is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)                                                                                
      sort_order: Mapped[int] = mapped_column(Integer, default=0)                                                                                                   
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # Banners                                                                                                                                                         
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class Banner(Base):                                                                                                                                               
      __tablename__ = "banners"                                                                                                                                     
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      title: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                      
      description: Mapped[Optional[str]] = mapped_column(Text)                                                                                                      
      thumbnail: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                  
      link: Mapped[Optional[str]] = mapped_column(Text)                                                                                                             
      link_text: Mapped[Optional[str]] = mapped_column(Text)                                                                                                        
      link_target: Mapped[str] = mapped_column(Text, default="_self")  # LinkTarget enum                                                                            
      type: Mapped[str] = mapped_column(Text, nullable=False, default="main")  # BannerType enum                                                                    
      position: Mapped[int] = mapped_column(Integer, default=0)                                                                                                     
      badge: Mapped[Optional[str]] = mapped_column(Text)                                                                                                            
      badge_color: Mapped[Optional[str]] = mapped_column(Text)                                                                                                      
      is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)                                                                                
      starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                               
      ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                                 
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
                                                                                                                                                                    
                                                                                                                                                                    
  # =============================================================================                                                                                   
  # Assets                                                                                                                                                          
  # =============================================================================                                                                                   
                                                                                                                                                                    
  class Asset(Base):                                                                                                                                                
      __tablename__ = "assets"                                                                                                                                      
      __table_args__ = (                                                                                                                                            
          UniqueConstraint("bucket", "storage_key", name="assets_bucket_storage_key_idx"),                                                                          
      )                                                                                                                                                             
                                                                                                                                                                    
      id: Mapped[UUID] = mapped_column(                                                                                                                             
          PGUUID(as_uuid=True), primary_key=True, default=uuid4                                                                                                     
      )                                                                                                                                                             
      user_id: Mapped[UUID] = mapped_column(                                                                                                                        
          PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False                                                                          
      )                                                                                                                                                             
      storage_key: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                
      bucket: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                     
      filename: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                   
      mime_type: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                  
      size: Mapped[int] = mapped_column(Integer, nullable=False)                                                                                                    
      visibility: Mapped[str] = mapped_column(Text, nullable=False, default="private")  # AssetVisibility enum                                                      
      module: Mapped[str] = mapped_column(Text, nullable=False)                                                                                                     
      task_id: Mapped[Optional[UUID]] = mapped_column(                                                                                                              
          PGUUID(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL")                                                                                         
      )                                                                                                                                                             
      post_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))                                                                                         
      published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)                                                                                            
      created_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now()                                                                                                       
      )                                                                                                                                                             
      updated_at: Mapped[datetime] = mapped_column(                                                                                                                 
          DateTime, nullable=False, server_default=func.now(), onupdate=func.now()                                                                                  
      )                                                                                                                                                             
      deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)  # Soft delete                                                                               
                                                                                                                                                                    
      # Relationships                                                                                                                                               
      user: Mapped["User"] = relationship(back_populates="assets")                                                                                                  
      task: Mapped[Optional["Task"]] = relationship(back_populates="assets")                                                                                        
                                                                                                                                                                    
  Tables included (12 total):                                                                                                                                       
  ┌─────────────────────┬────────────────────────────────────────────┐                                                                                              
  │        Table        │                Description                 │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ users               │ User accounts                              │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ sessions            │ Better Auth sessions                       │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ accounts            │ OAuth/password accounts                    │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ verifications       │ Email/password reset tokens                │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ providers           │ AI provider configs (encrypted keys)       │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ tool_types          │ Tool categories                            │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ tools               │ AI tools with JSON config                  │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ tasks               │ Task execution with parent/child hierarchy │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ credits             │ User credit balances                       │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ credit_transactions │ Credit transaction history                 │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ credit_packages     │ Purchasable credit packages                │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ banners             │ Homepage banners                           │                                                                                              
  ├─────────────────────┼────────────────────────────────────────────┤                                                                                              
  │ assets              │ Multi-bucket file storage                  │                                                                                              
  └─────────────────────┴────────────────────────────────────────────┘    