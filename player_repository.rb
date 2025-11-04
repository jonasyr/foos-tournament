$LOAD_PATH << '.'

require 'dm/data_model'
require 'player'

# Persistence facade for {Player} entities.
#
# The repository hides DataMapper specifics and returns lightweight domain
# objects to the rest of the application. It is intentionally thin to keep CLI
# tools and Sinatra routes decoupled from the ORM.
class PlayerRepository

public

  # Finds a player by identifier.
  #
  # @param player_id [Integer]
  # @return [Player, nil]
  def get(player_id)
    player_record = DataModel::Player.get(player_id)
    return map_record_to_entity(player_record)
  end

  # Loads all players from the database.
  #
  # @return [Array<Player>]
  def get_all_players()
    player_records = DataModel::Player.all()
    player_entities = []
    player_records.each do |p|
      player_entities << map_record_to_entity(p)
    end
    return player_entities
  end

  # Returns all players keyed by their identifier.
  #
  # @return [Hash{Integer=>Player}]
  def get_all_players_by_id()
    player_records = DataModel::Player.all()
    players_by_id = {}
    player_records.each do |p|
      players_by_id[p.id] = map_record_to_entity(p)
    end
    return players_by_id
  end

  # Retrieves players assigned to a specific division.
  #
  # @param division_id [Integer]
  # @return [Array<Player>]
  def get_division_players(division_id)
    player_records = DataModel::Player.all(DataModel::Player.divisions.id => division_id)
    player_entities = []
    player_records.each do |p|
      player_entities << map_record_to_entity(p)
    end
    return player_entities
  end

  # TODO
  # Associates a player with a division.
  #
  # @param division_id [Integer]
  # @param player_id [Integer]
  # @param nmatches [Integer]
  # @return [void]
  def assign_player(division_id, player_id, nmatches)
    Divisionplayer.create(Divisionplayer.division.id => division_id, Divisionplayer.player.id => player_id)
  end

  # Persists a new player.
  #
  # @param player_entity [Player]
  # @return [Integer] identifier assigned by the database
  def add(player_entity)
    player_record = DataModel::Player.new()
    player_record.name = player_entity.name
    player_record.nick = player_entity.nick
    player_record.save
    player_entity.id = player_record.id
    return player_record.id
  end

private

  # Converts a DataMapper record into a domain entity.
  #
  # @param player_record [DataModel::Player]
  # @return [Player]
  def map_record_to_entity(player_record)
    player_entity = Player.new(player_record.id, player_record.name, player_record.nick)
  end

end
