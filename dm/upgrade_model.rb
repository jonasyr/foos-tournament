$LOAD_PATH << '..'

require './data_model'

DataMapper.auto_upgrade!
puts "DB upgraded."
