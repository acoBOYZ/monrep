//! Active process registry for cancel.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::process::Child;
use tokio::sync::Mutex;

pub type RunRegistry = Arc<Mutex<HashMap<String, Child>>>;

pub fn new_registry() -> RunRegistry {
  Arc::new(Mutex::new(HashMap::new()))
}
