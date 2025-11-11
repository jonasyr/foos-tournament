require 'sinatra'
require 'sinatra/config_file'
require 'yaml'

# Ruby 2.4+ compatibility: Fixnum and Bignum were unified into Integer
Fixnum = Integer unless defined?(Fixnum)
Bignum = Integer unless defined?(Bignum)

require 'data_mapper'

# Monkey patch for DataMapper compatibility with modern Ruby
# The Query::Operator class is missing the 'field' method that was renamed to 'target'
module DataMapper
  class Query
    class Operator
      def field
        target
      end unless method_defined?(:field)
    end
  end
end

config_file File.join(File.dirname(File.expand_path(__FILE__)), 'config.yaml')

CONFIG_PATH = File.join(File.dirname(__FILE__), 'config.yaml')
CONFIG = YAML.load_file(CONFIG_PATH)

DB_URI   = CONFIG['db_uri']    || 'sqlite:///./tournament.db'
API_KEYS = CONFIG['api_keys']  || []
BIND_HOST = CONFIG['bind_host'] || '0.0.0.0'
BIND_PORT = (CONFIG['bind_port'] || 4567).to_i

# Note: DataMapper.setup is done in dm/data_model.rb using Conf.settings.db_uri

module Conf
  # Shortcut accessor to retrieve global Sinatra settings.
  #
  # @return [Sinatra::Base::Settings]
  def settings
    Sinatra::Application.settings
  end
  module_function :settings
end
