# Aggregates the tournament structure for a foosball season.
#
# A season groups multiple divisions, tracks the execution status, and stores
# timestamps for start and end dates. Repositories populate instances to expose
# read-only state to the web routes and CLI tools.
#
# @!attribute [rw] id
#   Unique identifier assigned during persistence.
#   @return [Integer, nil]
# @!attribute [r] title
#   Display title for the season.
#   @return [String]
# @!attribute [r] status
#   Lifecycle status (e.g., :preparing, :playing, :finished).
#   @return [Symbol, nil]
# @!attribute [r] start_time
#   Timestamp when the season started.
#   @return [Time, nil]
# @!attribute [r] end_time
#   Timestamp when the season finished.
#   @return [Time, nil]
# @!attribute [r] divisions
#   Division entities belonging to the season.
#   @return [Array<Division>]
class Season

attr_accessor :id
attr_reader :title
attr_reader :status
attr_reader :start_time
attr_reader :end_time
attr_reader :divisions

@divisions = []

  # Builds a new season entity with the provided identifier and title.
  #
  # @param id [Integer, nil] database identifier
  # @param title [String] display title
  def initialize(id, title)
  @id = id
  @title = title
end

  # Updates lifecycle metadata for the season.
  #
  # @param status [Symbol] lifecycle status (:preparing, :playing, :finished)
  # @param start_time [Time, nil] optional start timestamp
  # @param end_time [Time, nil] optional end timestamp
  # @return [void]
  def set_status(status, start_time, end_time)
  @status = status
  @start_time = start_time
  @end_time = end_time
end

  # Replaces the list of divisions associated with the season.
  #
  # @param divisions [Array<Division>]
  # @return [void]
  def set_divisions(divisions)
  @divisions = divisions
end

end
