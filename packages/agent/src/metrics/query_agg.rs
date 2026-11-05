//! Metrics query aggregation kind (std-only).

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QueryAgg {
  Avg,
  Min,
  Max,
}

impl QueryAgg {
  pub fn parse(s: Option<&str>) -> Self {
    match s.map(|x| x.to_ascii_lowercase()).as_deref() {
      Some("min") => Self::Min,
      Some("max") => Self::Max,
      _ => Self::Avg,
    }
  }

  pub(crate) fn sql(self) -> &'static str {
    match self {
      Self::Avg => "avg(value)",
      Self::Min => "min(value)",
      Self::Max => "max(value)",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parse_aliases_and_fallback() {
    assert_eq!(QueryAgg::parse(None), QueryAgg::Avg);
    assert_eq!(QueryAgg::parse(Some("avg")), QueryAgg::Avg);
    assert_eq!(QueryAgg::parse(Some("min")), QueryAgg::Min);
    assert_eq!(QueryAgg::parse(Some("max")), QueryAgg::Max);
    assert_eq!(QueryAgg::parse(Some("MIN")), QueryAgg::Min);
    assert_eq!(QueryAgg::parse(Some("Max")), QueryAgg::Max);
    assert_eq!(QueryAgg::parse(Some("unknown")), QueryAgg::Avg);
    assert_eq!(QueryAgg::parse(Some("")), QueryAgg::Avg);
  }

  #[test]
  fn sql_expressions() {
    assert_eq!(QueryAgg::Avg.sql(), "avg(value)");
    assert_eq!(QueryAgg::Min.sql(), "min(value)");
    assert_eq!(QueryAgg::Max.sql(), "max(value)");
  }
}
