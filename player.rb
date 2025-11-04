# Represents a foosball participant in the tournament system.
#
# Player entities encapsulate the minimal data required across the CLI, web UI,
# and repositories: an identifier, the full name, and the display nickname.
# They are deliberately lightweight to keep serialization simple and to avoid
# coupling domain logic to DataMapper models.
#
# @!attribute [rw] id
#   Unique identifier, assigned after persistence.
#   @return [Integer, nil]
# @!attribute [r] name
#   Full player name used for reporting.
#   @return [String]
# @!attribute [r] nick
#   Short nickname displayed in scoreboards.
#   @return [String]
class Player

attr_accessor :id
attr_reader :name
attr_reader :nick

  # Creates a new player entity.
  #
  # @param id [Integer, nil] database identifier
  # @param name [String] full name of the player
  # @param nick [String] nickname used in UI components
  def initialize(id, name, nick)
  @id = id
  @name = name
  @nick = nick
end

end
