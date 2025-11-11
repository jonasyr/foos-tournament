require 'net/http'

# Dispatches configured hooks when match events occur.
#
# Hooks can be HTTP endpoints or shell commands defined in `config.yaml`. This
# module centralises the execution logic so that both web and CLI code can reuse
# the same integration surface.
module HookManager

  # Invokes hooks registered for the `match_played` event.
  #
  # @param match_id [Integer]
  # @return [void]
  def self.match_played(match_id)
    hooks = Conf.settings.hooks['match_played']
    params = { 'match_id' => match_id }
    run_hooks(hooks, params)
  end

  # Invokes hooks registered for the `match_cancelled` event.
  #
  # @param match_id [Integer]
  # @return [void]
  def self.match_cancelled(match_id)
    hooks = Conf.settings.hooks['match_cancelled']
    params = { 'match_id' => match_id }
    run_hooks(hooks, params)
  end

  # Iterates through hook definitions and executes them with provided params.
  #
  # @param hooks [Array<Hash>] hook configurations from settings
  # @param params [Hash] key-value pairs to send to the hook
  def self.run_hooks(hooks, params)
    hooks.each do |hook|
      if hook['type'] == 'http'
        hook_web(hook['url'], params)
      elsif hook['type'] == 'exec'
        hook_exec(hook['command'], params)
      end
    end
  end

  # Executes a shell command hook.
  #
  # @param command [String]
  # @param params [Hash]
  # @return [String] command output
  def self.hook_exec(command, params)
    command_line = command
    params.each do |k, v|
      command_line += " #{k}=#{v}"
    end
    result = `#{command_line}`
  end

  # Issues an HTTP POST request for a hook definition.
  #
  # @param url [String]
  # @param params [Hash]
  # @return [void]
  # @note Error handling is currently best-effort with console logging.
  def self.hook_web(url, params)
    uri = URI(url)
    begin
      response = Net::HTTP.post_form(uri, params)
    rescue Exception => e
      puts "HTTP POST to #{uri.to_s} failed"
      return
    end
    if response.code == '200'
      puts "HTTP POST to #{uri.to_s} executed correctly"
    else
      puts "HTTP POST to #{uri.to_s} failed with error #{response.code}"
    end
  end

end
