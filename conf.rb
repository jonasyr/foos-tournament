require 'sinatra'
require 'sinatra/config_file'
require 'yaml'

# Ruby 2.4+ compatibility: Fixnum and Bignum were unified into Integer
Fixnum = Integer unless defined?(Fixnum)
Bignum = Integer unless defined?(Bignum)

require 'data_mapper'

config_file File.join(File.dirname(File.expand_path(__FILE__)), 'config.yaml')

CONFIG_PATH = File.join(File.dirname(__FILE__), 'config.yaml')
CONFIG = YAML.load_file(CONFIG_PATH)

DB_URI   = CONFIG['db_uri']    || 'sqlite:///./tournament.db'
API_KEYS = CONFIG['api_keys']  || []
BIND_HOST = CONFIG['bind_host'] || '0.0.0.0'
BIND_PORT = (CONFIG['bind_port'] || 4567).to_i

DataMapper.setup(:default, DB_URI)

module Conf
  module_function
  def settings; Sinatra::Application.settings end
end
