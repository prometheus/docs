require 'rspec'
require 'helpers/download'

describe Downloads::Binary do
  let(:asset) do
    Downloads::Binary.new({
      'name' => ' prometheus-1.2.0.freebsd-armv5.tar.gz',
    })
  end

  let(:beta) do
    Downloads::Binary.new({
      'name' => 'alertmanager-0.5.0-beta.0.darwin-amd64.tar.gz',
    })
  end

  describe '#os' do
    it 'extracts the operating system name' do
      expect(asset.os).to eql('freebsd')
      expect(beta.os).to eql('darwin')
    end
  end

  describe '#arch' do
    it 'extracts the architecture' do
      expect(asset.arch).to eql('armv5')
      expect(beta.arch).to eql('amd64')
    end
  end
end

describe Downloads::Release do
  let(:rc0) { Downloads::Release.new({ 'tag_name' => 'v1.21.0-rc0', 'prerelease' => true }) }
  let(:rc1) { Downloads::Release.new({ 'tag_name' => 'v1.21.0-rc1', 'prerelease' => true }) }
  let(:regular) { Downloads::Release.new({ 'tag_name' => 'v1.20.0' }) }
  let(:bugfix) { Downloads::Release.new({ 'tag_name' => 'v1.19.3' }) }
  let(:oldrc) { Downloads::Release.new({ 'tag_name' => 'v1.19.0-rc' }) }

  describe '#version' do
    it 'returns a parsed semverse version object' do
      expect(oldrc.version.pre_release).to eql('rc')
    end
  end

  describe '#<=>' do
    it 'sorts releases by version' do
      expect([bugfix, regular, rc1, rc0].sort).to eql([bugfix, regular, rc0, rc1])
    end
  end

  describe '#binaries' do
    let(:release) do
      Downloads::Release.new({ 'assets' => [
        { 'name' => 'prometheus-1.2.0.linux-amd64.tar.gz' },
        { 'name' => 'prometheus-1.2.0.windows-amd64.tar.gz' },
        { 'name' => 'prometheus-1.2.0.windows-amd64.zip' },
      ]})
    end

    it 'prefers .zip format over .tar.gz' do
      expect(release.binaries.map(&:name)).to eql(['prometheus-1.2.0.linux-amd64.tar.gz', 'prometheus-1.2.0.windows-amd64.zip'])
    end
  end
end

describe Downloads::Repository do
  let(:rc0) { Downloads::Release.new({ 'tag_name' => 'v1.21.0-rc0', 'prerelease' => true }) }
  let(:rc1) { Downloads::Release.new({ 'tag_name' => 'v1.21.0-rc1', 'prerelease' => true }) }
  let(:regular) { Downloads::Release.new({ 'tag_name' => 'v1.20.0' }) }
  let(:bugfix) { Downloads::Release.new({ 'tag_name' => 'v1.19.3' }) }
  let(:oldrc) { Downloads::Release.new({ 'tag_name' => 'v1.19.0-rc' }) }
  let(:repo) { Downloads::Repository.new({}, releases: [oldrc, bugfix, regular, rc1, rc0]) }

  describe '#releases' do
    it 'returns latest release candidate and latest regular version regardless of release order' do
      expect(repo.releases).to eql([rc1, regular])
    end
  end
end
